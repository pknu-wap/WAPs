package wap.web2.server.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import wap.web2.server.member.entity.Role;

@Getter
@AllArgsConstructor
public class RoleChangeResponse {

    private int updatedUserCount;
    private Role changeTo;

}
