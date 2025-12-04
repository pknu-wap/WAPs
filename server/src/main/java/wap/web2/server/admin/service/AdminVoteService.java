package wap.web2.server.admin.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
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
        VoteStatus status = voteMetaRepository.findStatusBySemester(semester)
                .orElse(VoteStatus.NOT_CREATED);

        return new VoteStatusResponse(status);
    }

    @Transactional
    public void openVote(String semester, Long userId, VoteParticipants voteParticipants) {
        Set<Long> newProjectIds = voteParticipants.projectIds();
        validateProjectIds(newProjectIds);

        VoteMeta voteMeta = voteMetaRepository.findBySemester(semester)
                .orElse(null);

        if (voteMeta != null) {
            voteMeta.reopenTo(newProjectIds);
            return;
        }

        VoteMeta newMeta = VoteMeta.of(semester, userId, newProjectIds);
        voteMetaRepository.save(newMeta);
    }

    @CacheEvict(value = "voteResults", allEntries = true)
    @Transactional
    public void closeVote(String semester, Long userId) {
        VoteMeta voteMeta = voteMetaRepository.findBySemester(semester)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 현재 학기의 투표가 존재하지 않습니다."));

        voteMeta.close(userId);
    }

    @CacheEvict(value = "voteResults", allEntries = true)
    @Transactional
    public void changeResultStatus(String semester, Boolean status) {
        voteMetaRepository.updateResultVisibility(status, semester);
    }

    @Transactional
    public List<AdminVoteResultResponse> getVoteResult(String semester) {
        List<ProjectVoteCount> projectVoteCounts = ballotRepository.countVotesByProject(semester);
        long totalVotes = calculateTotalVotes(projectVoteCounts);

        return projectVoteCounts.stream().map(pvc -> AdminVoteResultResponse.of(pvc, totalVotes)).toList();
    }

    @Transactional
    public VoteResultsVisibility getVisibility(String semester) {
        Boolean isPublic = voteMetaRepository.findIsResultPublicBySemester(semester)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 투표가 생성되지 않았습니다."));
        return new VoteResultsVisibility(isPublic);
    }

    private long calculateTotalVotes(List<ProjectVoteCount> projectVoteCounts) {
        return projectVoteCounts.stream()
                .mapToLong(ProjectVoteCount::getVoteCount)
                .sum();
    }

    private void validateProjectIds(Set<Long> projectIds) {
        Set<Long> existingProjectIds = new HashSet<>(projectRepository.findExistingProjectIds(projectIds));
        Set<Long> missing = new HashSet<>(projectIds);
        missing.removeAll(existingProjectIds);

        if (!missing.isEmpty()) {
            throw new ResourceNotFoundException("[ERROR] 존재하지 않는 프로젝트가 포함되어 있습니다. missingIds=" + missing);
        }
    }

}
