package wap.web2.server.vote.service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.admin.entity.VoteStatus;
import wap.web2.server.admin.repository.VoteMetaRepository;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.security.core.UserPrincipal;
import wap.web2.server.util.SemesterGenerator;
import wap.web2.server.vote.dto.ProjectVoteCount;
import wap.web2.server.vote.dto.VoteInfoResponse;
import wap.web2.server.vote.dto.VoteRequest2;
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
    public void vote(Long userId, String role, VoteRequest2 voteRequest) {
        String semester = voteRequest.semester();
        Role userRole = Role.from(role);

        VoteStatus voteStatus = voteMetaRepository.findStatusBySemester(semester)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 투표가 존재하지 않습니다."));
        if (voteStatus != VoteStatus.OPEN) {
            throw new IllegalArgumentException(String.format("[ERROR] %s학기의 투표가 열리지 않았습니다.", semester));
        }

        validateUserBallot(semester, userId);
        for (Long projectId : voteRequest.projectIds()) {
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
        boolean isOpen = (voteStatus == VoteStatus.OPEN);

        return VoteInfoResponse.builder()
                .isVotedUser(isVotedUser)
                .isOpen(isOpen)
                .build();
    }

    @Transactional(readOnly = true)
    public List<VoteResultResponse> getVoteResults(Integer year, Integer sem) {
        // TODO: Integer를 받고 String으로 변환하도록 임시로 처리함
        if (year == null || sem == null) {
            year = SemesterGenerator.generateYearValue();
            sem = SemesterGenerator.generateSemesterValue();
        }
        String semester = SemesterGenerator.convertFrom(year, sem);

        List<ProjectVoteCount> voteCounts = ballotRepository.countVotesByProject(semester);
        long totalVotes = voteCounts.stream()
                .mapToLong(ProjectVoteCount::voteCount)
                .sum();

        Map<Long, Project> projects = loadProjects(voteCounts);
        return voteCounts.stream()
                .map(voteCount -> mapToResponse(voteCount, projects.get(voteCount.projectId()), totalVotes))
                .sorted(Comparator.comparing(VoteResultResponse::voteCount).reversed())
                .toList();
    }

    private void validateUserBallot(String semester, Long userId) {
        long votedCount = ballotRepository.countBallotsBySemesterAndUserId(semester, userId);
        if (votedCount >= 3) {
            throw new IllegalArgumentException("[ERROR] 투표는 최대 3개까지 가능합니다.");
        }
    }

    private Map<Long, Project> loadProjects(List<ProjectVoteCount> voteCounts) {
        List<Long> projectIds = voteCounts.stream()
                .map(ProjectVoteCount::projectId)
                .toList();

        return projectRepository.findAllById(projectIds)
                .stream()
                .collect(Collectors.toMap(Project::getProjectId, p -> p));
    }

    private VoteResultResponse mapToResponse(ProjectVoteCount voteCount, Project project, long totalVotes) {
        double rate = (totalVotes == 0) ? 0 : (voteCount.voteCount() * 100.0) / totalVotes;

        return VoteResultResponse.builder()
                .projectName(project.getTitle())
                .projectSummary(project.getSummary())
                .thumbnail(project.getThumbnail())
                .voteCount(voteCount.voteCount())
                .voteRate(Math.round(rate * 10) / 10.0)  // 소수점 1자리
                .build();
    }

}
