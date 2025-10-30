package wap.web2.server.admin.dto;

import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.User;

public record UserRoleResponse(
        Long id,
        String name,
        String email,
        Role role
) {
    public static UserRoleResponse from(User user) {
        return new UserRoleResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}
