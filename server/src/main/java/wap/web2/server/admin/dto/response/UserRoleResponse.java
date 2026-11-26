package wap.web2.server.admin.dto.response;

import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.MembershipLevel;
import wap.web2.server.member.entity.User;

public record UserRoleResponse(Long id, String name, String email, Role role, MembershipLevel membershipLevel) {
    @com.fasterxml.jackson.annotation.JsonProperty("memberType")
    public String memberType() {
        return membershipLevel == MembershipLevel.NONE ? "UNDECIDED" : membershipLevel.name();
    }
    public static UserRoleResponse from(User user) {
        return new UserRoleResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getMembershipLevel());
    }
}
