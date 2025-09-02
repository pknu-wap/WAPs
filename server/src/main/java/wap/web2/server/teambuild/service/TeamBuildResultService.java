package wap.web2.server.teambuild.service;

import static wap.web2.server.util.SemesterGenerator.generateSemester;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import wap.web2.server.teambuild.dto.response.TeamBuildingResults;
import wap.web2.server.teambuild.entity.Team;
import wap.web2.server.teambuild.repository.TeamRepository;

@Service
@RequiredArgsConstructor
public class TeamBuildResultService {

    private final TeamRepository teamRepository;

    public TeamBuildingResults getResults() {
        List<Team> teams = teamRepository.findAllBySemester(generateSemester());

        Map<Long, List<Long>> results = new HashMap<>();
        for (Team team : teams) {
            List<Long> members = results.computeIfAbsent(team.getProjectId(), k -> new ArrayList<>());
            members.add(team.getMemberId());
        }

        return TeamBuildingResults.from(results);
    }

}
