package wap.web2.server.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.project.entity.TeamMember;

@Getter
@Builder
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

    // TeamMember를 TeamMemberDto로 변환하는 정적 팩토리 메서드
    // 엔티티를 바로 Response로 바꿀 시 TeamMember의 Project 필드로 인해 연쇄적으로 데이터가 쌓임
    public static TeamMemberDto from(TeamMember teamMember) {
        return TeamMemberDto.builder()
                .memberName(teamMember.getMemberName())
                .memberRole(teamMember.getMemberRole())
                .build();
    }

}
