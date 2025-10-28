package wap.web2.server.member.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import wap.web2.server.member.entity.Role;

@Getter
@AllArgsConstructor
public class UserRoleResponse {

    private Role role;
    private boolean isRoleAssigned;
}
