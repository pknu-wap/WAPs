package wap.web2.server.teambuild.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import wap.web2.server.teambuild.dto.TeamMemberResult;

@Getter
@AllArgsConstructor
public class TeamResultsResponse {

    private List<TeamBuildingResult> results;
    private List<TeamMemberResult> unassigned;

}
