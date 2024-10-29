package wap.web2.server.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.domain.TeamMember;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberDto {
    private String memberName;
    private String memberRole;

    public TeamMember toEntity() {
        return TeamMember.builder()
                .memberName(memberName)
                .memberRole(memberRole)
                .build();
    }
}
