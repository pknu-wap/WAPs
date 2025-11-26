package wap.web2.server.vote.service;

import static wap.web2.server.util.SemesterGenerator.generateSemester;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.admin.entity.VoteMeta;
import wap.web2.server.admin.entity.VoteStatus;
import wap.web2.server.admin.repository.VoteMetaRepository;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.security.core.UserPrincipal;
import wap.web2.server.vote.dto.ProjectVoteCount;
import wap.web2.server.vote.dto.VoteInfoResponse;
import wap.web2.server.vote.dto.VoteParticipants;
import wap.web2.server.vote.dto.VoteParticipantsResponse;
import wap.web2.server.vote.dto.VoteRequest;
import wap.web2.server.vote.dto.VoteResultResponse;
import wap.web2.server.vote.entity.Ballot;
import wap.web2.server.vote.repository.BallotRepository;

@Service
@RequiredArgsConstructor
public class VoteService {

    private final UserRepository userRepository;
    private final BallotRepository ballotRepository;
    private final ProjectRepository projectRepository;
    private final VoteMetaRepository voteMetaRepository;

    @Transactional
    public void vote(Long userId, String role, VoteRequest voteRequest) {
        String semester = voteRequest.semester();
        Role userRole = Role.from(role);

        VoteMeta voteMeta = voteMetaRepository.findBySemester(semester)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 투표가 존재하지 않습니다."));

        if (voteMeta.getStatus() != VoteStatus.VOTING) {
            throw new IllegalArgumentException(String.format("[ERROR] %s학기의 투표가 열리지 않았습니다.", semester));
        }

        List<Long> projectIds = voteRequest.projectIds();
        validateUserBallot(semester, userId);
        validateParticipatingProjects(projectIds, voteMeta.getId());
        for (Long projectId : projectIds) {
            ballotRepository.save(Ballot.of(semester, userId, userRole, projectId));
        }
    }

    @Transactional(readOnly = true)
    public VoteInfoResponse getVoteInfo(UserPrincipal userPrincipal, String semester) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));
        VoteStatus voteStatus = voteMetaRepository.findStatusBySemester(semester)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 투표가 존재하지 않습니다."));

        long votedCount = ballotRepository.countBallotsBySemesterAndUserId(semester, user.getId());
        boolean isVotedUser = votedCount > 0;
        boolean isOpen = (voteStatus == VoteStatus.VOTING);

        return VoteInfoResponse.builder()
                .isVotedUser(isVotedUser)
                .isOpen(isOpen)
                .build();
    }

    @Transactional(readOnly = true)
    public List<VoteResultResponse> getVoteResults(String semester) {
        validateResultVisibility(semester);

        List<ProjectVoteCount> projectVoteCounts = ballotRepository.countVotesByProject(semester);
        long totalVotes = calculateTotalVotes(projectVoteCounts);

        return projectVoteCounts.stream().map(pvc -> VoteResultResponse.of(pvc, totalVotes)).toList();
    }

    @Transactional(readOnly = true)
    public List<VoteResultResponse> getMostRecentResults() {
        String currentSemester = generateSemester();
        List<ProjectVoteCount> latestVotes = ballotRepository.findPublicLatestBallots(currentSemester,
                VoteStatus.ENDED);

        if (latestVotes.isEmpty()) {
            throw new IllegalArgumentException("[ERROR] 현재까지 투표가 진행된 적이 없습니다.");
        }

        long totalVotes = calculateTotalVotes(latestVotes);

        return latestVotes.stream().map(lv -> VoteResultResponse.of(lv, totalVotes)).toList();
    }

    @Transactional(readOnly = true)
    public List<VoteParticipantsResponse> getParticipants(String semester) {
        List<VoteParticipants> participants
                = voteMetaRepository.findParticipantsProjectBySemester(semester);

        return participants.stream().map(VoteParticipantsResponse::from).toList();
    }


    private long calculateTotalVotes(List<ProjectVoteCount> projectVoteCounts) {
        return projectVoteCounts.stream()
                .mapToLong(ProjectVoteCount::getVoteCount)
                .sum();
    }

    private void validateUserBallot(String semester, Long userId) {
        long votedCount = ballotRepository.countBallotsBySemesterAndUserId(semester, userId);
        if (votedCount >= 3) {
            throw new IllegalArgumentException("[ERROR] 투표는 최대 3개까지 가능합니다.");
        }
    }

    private void validateParticipatingProjects(List<Long> projectIds, Long voteMetaId) {
        Set<Long> participants = voteMetaRepository.findParticipantsByVoteMetaId(voteMetaId);

        Set<Long> invalidIds = projectIds.stream()
                .filter(id -> !participants.contains(id))
                .collect(Collectors.toSet());

        if (!invalidIds.isEmpty()) {
            throw new IllegalArgumentException(
                    "[ERROR] 투표에 참여하지 않는 프로젝트가 포함되어 있습니다. invalidProjectIds=" + invalidIds
            );
        }
    }

    private void validateResultVisibility(String semester) {
        boolean isPublic = voteMetaRepository.isResultPublic(semester);
        if (!isPublic) {
            throw new IllegalArgumentException("[ERROR] 해당 투표 결과는 비공개입니다.");
        }
    }

}
