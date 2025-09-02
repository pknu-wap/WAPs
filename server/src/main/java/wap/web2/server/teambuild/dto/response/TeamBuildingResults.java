package wap.web2.server.teambuild.dto.response;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TeamBuildingResults {

    private List<TeamBuildingResult> results;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamBuildingResult {
        private Long projectId;
        private Set<Long> memberIds;
    }

    public static TeamBuildingResults from(Map<Long, Set<Long>> result) {
        List<TeamBuildingResult> results = new ArrayList<>();
        for (Entry<Long, Set<Long>> entry : result.entrySet()) {
            long projectId = entry.getKey();
            results.add(new TeamBuildingResult(projectId, entry.getValue()));
        }

        return new TeamBuildingResults(results);
    }

}
