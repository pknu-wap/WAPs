package wap.web2.server.admin.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.admin.dto.request.VoteParticipants;
import wap.web2.server.admin.dto.response.AdminVoteResultResponse;
import wap.web2.server.admin.dto.response.VoteResultsVisibility;
import wap.web2.server.admin.dto.response.VoteStatusResponse;
import wap.web2.server.admin.entity.VoteMeta;
import wap.web2.server.admin.entity.VoteStatus;
import wap.web2.server.admin.repository.VoteMetaRepository;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.exception.ConflictException;
import static wap.web2.server.vote.service.VotePolicy.REQUIRED_VOTE_COUNT;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.vote.dto.ProjectVoteCount;
import wap.web2.server.vote.repository.BallotRepository;

@Service
@RequiredArgsConstructor
public class AdminVoteService {

    private final VoteMetaRepository voteMetaRepository;
    private final ProjectRepository projectRepository;
    private final BallotRepository ballotRepository;

    @Transactional(readOnly = true)
    public VoteStatusResponse getStatus(String semester) {
        VoteStatus status = voteMetaRepository
            .findStatusBySemester(semester)
            .orElse(VoteStatus.NOT_CREATED);

        return new VoteStatusResponse(status);
    }

    @Transactional
    public void openVote(String semester, Long userId, VoteParticipants voteParticipants) {
        Set<Long> newProjectIds = voteParticipants.projectIds();
        validateProjectIds(newProjectIds, semester);

        VoteMeta voteMeta = voteMetaRepository.findBySemester(semester).orElse(null);

        if (voteMeta != null) {
            throw new ConflictException("이미 생성된 투표입니다. 종료된 투표를 삭제한 후 새로 생성해 주세요.");
        }

        VoteMeta newMeta = VoteMeta.of(semester, userId, newProjectIds);
        try {
            voteMetaRepository.saveAndFlush(newMeta);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("이미 생성된 투표입니다.");
        }
    }

    @Transactional
    public void deleteVote(String semester) {
        VoteMeta voteMeta = voteMetaRepository.findBySemesterForUpdate(semester)
            .orElseThrow(() -> new ResourceNotFoundException("해당 학기의 투표를 찾을 수 없습니다."));
        if (voteMeta.getStatus() != VoteStatus.ENDED) {
            throw new ConflictException("종료된 투표만 삭제할 수 있습니다.");
        }
        ballotRepository.deleteBySemester(semester);
        voteMetaRepository.delete(voteMeta);
    }

    @Transactional
    public void closeVote(String semester, Long userId) {
        VoteMeta voteMeta = voteMetaRepository
            .findBySemesterForUpdate(semester)
            .orElseThrow(() ->
                new ResourceNotFoundException("해당 학기의 투표를 찾을 수 없습니다.")
            );

        voteMeta.close(userId);
    }

    @Transactional
    public void changeResultStatus(String semester, Boolean status) {
        if (status == null) throw new BadRequestException("공개 여부를 지정해 주세요.");
        VoteMeta voteMeta = voteMetaRepository.findBySemesterForUpdate(semester)
            .orElseThrow(() -> new ResourceNotFoundException("해당 학기의 투표를 찾을 수 없습니다."));
        voteMeta.changeResultVisibility(status);
    }

    @Transactional(readOnly = true)
    public List<AdminVoteResultResponse> getVoteResult(String semester) {
        if (!voteMetaRepository.existsBySemester(semester)) {
            throw new ResourceNotFoundException("해당 학기의 투표를 찾을 수 없습니다.");
        }
        List<ProjectVoteCount> projectVoteCounts = ballotRepository.countVotesByProject(semester);
        long totalVotes = calculateTotalVotes(projectVoteCounts);

        return projectVoteCounts
            .stream()
            .map(pvc -> AdminVoteResultResponse.of(pvc, totalVotes))
            .toList();
    }

    @Transactional(readOnly = true)
    public VoteResultsVisibility getVisibility(String semester) {
        Boolean isPublic = voteMetaRepository
            .findIsResultPublicBySemester(semester)
            .orElseThrow(() -> new ResourceNotFoundException("투표가 생성되지 않았습니다."));
        return new VoteResultsVisibility(isPublic);
    }

    private long calculateTotalVotes(List<ProjectVoteCount> projectVoteCounts) {
        return projectVoteCounts.stream().mapToLong(ProjectVoteCount::getVoteCount).sum();
    }

    private void validateProjectIds(Set<Long> projectIds, String semester) {
        if (projectIds == null || projectIds.size() < REQUIRED_VOTE_COUNT
            || projectIds.stream().anyMatch(id -> id == null || id <= 0)) {
            throw new BadRequestException("투표 대상은 유효한 프로젝트 " + REQUIRED_VOTE_COUNT + "개 이상이어야 합니다.");
        }
        Set<Long> existingProjectIds = new HashSet<>(
            projectRepository.findExistingProjectIds(projectIds, semester)
        );
        Set<Long> missing = new HashSet<>(projectIds);
        missing.removeAll(existingProjectIds);

        if (!missing.isEmpty()) {
            throw new ResourceNotFoundException(
                "해당 학기에 존재하지 않는 프로젝트가 포함되어 있습니다. missingIds=" + missing
            );
        }
    }
}
