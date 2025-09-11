package wap.web2.server.teambuild.dto.response;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
@AllArgsConstructor
public class TeamBuildingResults {

    private List<TeamBuildingResult> results;

    public TeamBuildingResults() {
        results = new ArrayList<>();
    }

    public void add(TeamBuildingResult result) {
        this.results.add(result);
    }

}
