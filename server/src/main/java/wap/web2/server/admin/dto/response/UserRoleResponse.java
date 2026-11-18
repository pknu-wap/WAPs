package wap.web2.server.admin.dto.response;

import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.entity.MemberType;

public record UserRoleResponse(Long id, String name, String email, Role role, MemberType memberType) {
    public static UserRoleResponse from(User user) {
        return new UserRoleResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getMemberType());
    }
}
