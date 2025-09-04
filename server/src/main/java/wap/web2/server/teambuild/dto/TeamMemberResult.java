package wap.web2.server.teambuild.dto;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import wap.web2.server.member.entity.User;
import wap.web2.server.teambuild.entity.Position;
import wap.web2.server.teambuild.entity.ProjectApply;

@Getter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberResult {
    private Long id;
    private String name;
    private Position position;

    public static TeamMemberResult fromLeader(User leader) {
        return new TeamMemberResult(leader.getId(), leader.getName(), null);
    }

    public static TeamMemberResult from(ProjectApply memberApplication) {
        return new TeamMemberResult(memberApplication.getUser().getId(), memberApplication.getUser().getName(),
                memberApplication.getPosition());
    }
}