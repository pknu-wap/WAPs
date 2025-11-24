package wap.web2.server.admin.service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.admin.dto.request.VoteParticipants;
import wap.web2.server.admin.dto.response.AdminVoteResultResponse;
import wap.web2.server.admin.dto.response.VoteStatusResponse;
import wap.web2.server.admin.entity.VoteMeta;
import wap.web2.server.admin.entity.VoteStatus;
import wap.web2.server.admin.repository.VoteMetaRepository;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.vote.dto.VoteCount;
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

    @Transactional
    public void closeVote(String semester, Long userId) {
        VoteMeta voteMeta = voteMetaRepository.findBySemester(semester)
                .orElseThrow(
                        () -> new IllegalArgumentException(String.format("[ERROR] %s학기의 투표가 존재하지 않습니다.", semester)));

        voteMeta.close(userId);
    }

    @Transactional
    public void changeResultStatus(String semester, Boolean status) {
        voteMetaRepository.updateResultVisibility(status, semester);
    }

    @Transactional
    public List<AdminVoteResultResponse> getVoteResult(String semester) {
        List<VoteCount> voteCounts = ballotRepository.countVotesByProject(semester);
        long totalVotes = calculateTotalVotes(voteCounts);

        return assembleVoteResults(voteCounts, totalVotes);
    }

    private long calculateTotalVotes(List<VoteCount> voteCounts) {
        return voteCounts.stream()
                .mapToLong(VoteCount::getVoteCount)
                .sum();
    }

    private List<AdminVoteResultResponse> assembleVoteResults(List<VoteCount> voteCounts, long totalVotes) {
        Map<Long, Project> projects = loadProjects(voteCounts);

        return voteCounts.stream()
                .map(voteCount -> mapToResponse(voteCount, projects.get(voteCount.getProjectId()), totalVotes))
                .sorted(Comparator.comparing(AdminVoteResultResponse::voteCount).reversed())
                .toList();
    }

    private Map<Long, Project> loadProjects(List<VoteCount> voteCounts) {
        List<Long> projectIds = voteCounts.stream()
                .map(VoteCount::getProjectId)
                .toList();

        return projectRepository.findAllById(projectIds)
                .stream()
                .collect(Collectors.toMap(Project::getProjectId, p -> p));
    }

    private AdminVoteResultResponse mapToResponse(VoteCount voteCount, Project project, long totalVotes) {
        double rate = (totalVotes == 0) ? 0 : (voteCount.getVoteCount() * 100.0) / totalVotes;

        return AdminVoteResultResponse.builder()
                .projectName(project.getTitle())
                .voteCount(voteCount.getVoteCount())
                .voteRate(Math.round(rate * 10) / 10.0)  // 소수점 1자리
                .build();
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
