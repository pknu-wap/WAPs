package wap.web2.server.teambuild.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import wap.web2.server.project.entity.Project;
import wap.web2.server.teambuild.dto.TeamMemberResult;

@Getter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class TeamBuildingResult {
    private Long projectId;
    private String teamName;
    private String summary; // note
    private TeamMemberResult leader;
    private List<TeamMemberResult> members;

    public static TeamBuildingResult of(Project project, TeamMemberResult leader, List<TeamMemberResult> members) {
        return new TeamBuildingResult(project.getProjectId(), project.getTitle(), project.getSummary(), leader,
                members);
    }
}