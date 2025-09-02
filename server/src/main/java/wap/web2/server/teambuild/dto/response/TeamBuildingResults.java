package wap.web2.server.teambuild.dto.response;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
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
        private List<Long> memberIds;
    }

    public static TeamBuildingResults from(Map<Long, List<Long>> result) {
        List<TeamBuildingResult> results = new ArrayList<>();
        for (Entry<Long, List<Long>> entry : result.entrySet()) {
            results.add(new TeamBuildingResult(entry.getKey(), entry.getValue()));
        }

        return new TeamBuildingResults(results);
    }

}
