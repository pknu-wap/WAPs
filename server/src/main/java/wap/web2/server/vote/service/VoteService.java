package wap.web2.server.vote.service;

import static wap.web2.server.vote.service.VotePolicy.REQUIRED_VOTE_COUNT;

import static wap.web2.server.util.SemesterGenerator.generateSemester;

import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.admin.entity.VoteMeta;
import wap.web2.server.admin.entity.VoteStatus;
import wap.web2.server.admin.repository.VoteMetaRepository;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.exception.ConflictException;
import wap.web2.server.exception.ForbiddenException;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.vote.dto.ProjectVoteCount;
import wap.web2.server.vote.dto.VoteInfoResponse;
import wap.web2.server.vote.dto.VoteParticipants;
import wap.web2.server.vote.dto.VoteParticipantsResponse;
import wap.web2.server.vote.dto.VoteRequest;
import wap.web2.server.vote.dto.VoteResultResponse;
import wap.web2.server.vote.dto.VoteResultsResponse;
import wap.web2.server.vote.entity.Ballot;
import wap.web2.server.vote.repository.BallotRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoteService {

    private final UserRepository userRepository;
    private final BallotRepository ballotRepository;
    private final VoteMetaRepository voteMetaRepository;

    @Transactional
    public void vote(UserPrincipal userPrincipal, VoteRequest voteRequest) {
        Long userId = userPrincipal.getId();
        Role userRole = resolveUserRole(userPrincipal);
        String semester = voteRequest.semester();

        // ponytail: serialize writes per semester; use shared meta + per-user locks if throughput requires it.
        VoteMeta voteMeta = voteMetaRepository.findBySemesterForUpdate(semester)
            .orElseThrow(() -> new ResourceNotFoundException("투표를 찾을 수 없습니다."));
        if (voteMeta.getStatus() != VoteStatus.VOTING) {
            throw new ConflictException(
                String.format("%s 학기의 투표가 진행 중이 아닙니다.", semester)
            );
        }

        List<Long> projectIds = voteRequest.projectIds();
        if (projectIds == null || projectIds.size() != REQUIRED_VOTE_COUNT
            || projectIds.stream().anyMatch(id -> id == null || id <= 0)
            || new HashSet<>(projectIds).size() != REQUIRED_VOTE_COUNT) {
            throw new BadRequestException("서로 다른 " + REQUIRED_VOTE_COUNT + "개의 프로젝트에 투표해야 합니다.");
        }
        validateUserBallot(semester, userId);
        validateParticipatingProjects(semester, userId, projectIds, voteMeta.getId());

        for (Long projectId : projectIds) {
            ballotRepository.save(Ballot.of(semester, userId, userRole, projectId));
        }
    }

    @Transactional(readOnly = true)
    public VoteInfoResponse getVoteInfo(UserPrincipal userPrincipal, String semester) {
        User user = findUser(userPrincipal.getId());
        VoteStatus voteStatus = findVoteStatus(semester);

        long votedCount = ballotRepository.countBallotsBySemesterAndUserId(semester, user.getId());
        boolean isVotedUser = votedCount > 0;
        boolean isOpen = voteStatus == VoteStatus.VOTING;

        return VoteInfoResponse.builder().isVotedUser(isVotedUser).isOpen(isOpen).build();
    }

    // 공개 여부는 DB에서 매번 확인한다. 로컬 결과 캐시는 다른 서버의 비공개 전환을 반영하지 못한다.
    @Transactional(readOnly = true)
    public VoteResultsResponse getVoteResults(String semester) {
        validateResultVisibility(semester);

        List<ProjectVoteCount> projectVoteCounts = ballotRepository.countVotesByProject(semester);
        long totalVotes = calculateTotalVotes(projectVoteCounts);

        List<VoteResultResponse> results = projectVoteCounts
            .stream()
            .map(projectVoteCount -> VoteResultResponse.of(projectVoteCount, totalVotes))
            .toList();

        return VoteResultsResponse.of(semester, results);
    }

    @Transactional(readOnly = true)
    public VoteResultsResponse getMostRecentResults() {
        String currentSemester = generateSemester();
        String latestSemester = ballotRepository.findPublicLatestSemester(
            currentSemester,
            VoteStatus.ENDED
        );
        if (latestSemester == null) {
            throw new ResourceNotFoundException("공개된 투표 결과가 없습니다.");
        }
        return getVoteResults(latestSemester);
    }

    @Transactional(readOnly = true)
    public List<VoteParticipantsResponse> getParticipants(String semester) {
        findVoteMeta(semester);
        List<VoteParticipants> participants = voteMetaRepository.findParticipantsProjectBySemester(
            semester
        );
        return participants.stream().map(VoteParticipantsResponse::from).toList();
    }

    private User findUser(Long userId) {
        return userRepository
            .findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
    }

    private Role resolveUserRole(UserPrincipal userPrincipal) {
        String role = userPrincipal
            .getUserRole()
            .orElseThrow(() -> new ForbiddenException("사용자 권한 정보가 존재하지 않습니다."));
        return Role.from(role);
    }

    private VoteMeta findVoteMeta(String semester) {
        return voteMetaRepository
            .findBySemester(semester)
            .orElseThrow(() -> new ResourceNotFoundException("투표를 찾을 수 없습니다."));
    }

    private VoteStatus findVoteStatus(String semester) {
        return voteMetaRepository
            .findStatusBySemester(semester)
            .orElse(VoteStatus.NOT_CREATED);
    }

    private long calculateTotalVotes(List<ProjectVoteCount> projectVoteCounts) {
        return projectVoteCounts.stream().mapToLong(ProjectVoteCount::getVoteCount).sum();
    }

    private void validateUserBallot(String semester, Long userId) {
        long votedCount = ballotRepository.countBallotsBySemesterAndUserId(semester, userId);
        if (votedCount > 0) {
            throw new ConflictException("이미 투표에 참여했습니다.");
        }
    }

    private void validateParticipatingProjects(
        String semester,
        Long userId,
        List<Long> projectIds,
        Long voteMetaId
    ) {
        Set<Long> participants = voteMetaRepository.findParticipantsByVoteMetaId(voteMetaId);

        Set<Long> invalidIds = projectIds
            .stream()
            .filter(projectId -> !participants.contains(projectId))
            .collect(Collectors.toSet());

        if (!invalidIds.isEmpty()) {
            log.warn(
                "유효하지 않은 투표 대상이 포함되었습니다. semester={}, userId={}, requestProjectIds={}, invalidProjectIds={}, allowedProjectIds={}",
                semester,
                userId,
                projectIds,
                invalidIds,
                participants
            );
            throw new BadRequestException("투표 대상이 아닌 프로젝트가 포함되어 있습니다.");
        }
    }

    private void validateResultVisibility(String semester) {
        VoteMeta meta = findVoteMeta(semester);
        if (meta.getStatus() != VoteStatus.ENDED || !meta.isResultPublic()) {
            throw new ForbiddenException("해당 투표 결과는 비공개입니다.");
        }
    }
}
