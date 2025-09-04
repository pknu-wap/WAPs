package wap.web2.server.teambuild.service;

import static wap.web2.server.util.SemesterGenerator.generateSemester;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.teambuild.dto.TeamMemberResult;
import wap.web2.server.teambuild.dto.response.TeamBuildingResult;
import wap.web2.server.teambuild.dto.response.TeamBuildingResults;
import wap.web2.server.teambuild.entity.Team;
import wap.web2.server.teambuild.repository.ProjectApplyRepository;
import wap.web2.server.teambuild.repository.TeamRepository;

@Service
@RequiredArgsConstructor
public class TeamBuildResultService {

    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final ProjectApplyRepository projectApplyRepository;

    @Transactional(readOnly = true)
    public TeamBuildingResults getResults() {
        List<Team> teams = teamRepository.findAllBySemester(generateSemester());
        TeamBuildingResults teamBuildingResults = new TeamBuildingResults();

        Map<Long, List<Long>> results = new HashMap<>();

        // projectId를 Key로 하여 팀별로 멤버 Ids를 묶음
        for (Team team : teams) {
            List<Long> members = results.computeIfAbsent(team.getProjectId(), k -> new ArrayList<>());
            members.add(team.getMemberId());
        }

        // 팀 구성 결과를 생성한 후 TeamBuildingResults 에 추가
        for (Entry<Long, List<Long>> team : results.entrySet()) {
            Long projectId = team.getKey();
            List<Long> memberIds = team.getValue();

            // projectId로 실제 생성된 프로젝트를 가져옴
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 프로젝트입니다."));
            // memberIds로 구성된 멤버의 지원서를 모두 가져옴.
            List<TeamMemberResult> members = projectApplyRepository.findAllByUserId(memberIds);
            TeamMemberResult leader = TeamMemberResult.fromLeader(project.getUser());

            TeamBuildingResult result = TeamBuildingResult.of(project, leader, members);
            teamBuildingResults.add(result);
        }

        return teamBuildingResults;
    }
}
