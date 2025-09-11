package wap.web2.server.teambuild.service;

import static wap.web2.server.util.SemesterGenerator.generateSemester;
import static wap.web2.server.util.SemesterGenerator.generateSemesterValue;
import static wap.web2.server.util.SemesterGenerator.generateYearValue;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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
        // 1) 이번 학기 모든 프로젝트
        List<Project> projects
                = projectRepository.findProjectsByYearAndSemester(generateYearValue(), generateSemesterValue());

        // 2) 이번 학기 팀 배정 결과(없을 수도 있음)
        List<Team> teamRows = teamRepository.findAllBySemester(generateSemester());

        // 3) 프로젝트별 팀원 ID 묶기
        Map<Long, List<Long>> memberIdsByProject = teamRows.stream()
                .collect(Collectors.groupingBy(
                        Team::getProjectId,
                        Collectors.mapping(Team::getMemberId, Collectors.toList())
                ));

        // 4) 결과 조립 (팀원이 없으면 빈 배열)
        TeamBuildingResults results = new TeamBuildingResults();

        for (Project project : projects) {
            Long projectId = project.getProjectId();
            List<Long> memberIds = memberIdsByProject.getOrDefault(projectId, Collections.emptyList());

            // 멤버 지원서 조회 (빈 리스트면 그대로 빈 결과 반환)
            List<TeamMemberResult> members = memberIds.isEmpty()
                    ? Collections.emptyList()
                    : projectApplyRepository.findAllByUserId(memberIds);

            // 리더 정보
            TeamMemberResult leader = TeamMemberResult.fromLeader(project.getUser());

            // 카드 DTO 생성
            TeamBuildingResult result = TeamBuildingResult.of(project, leader, members);
            results.add(result);
        }

        return results;
    }

}
