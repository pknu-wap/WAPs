package wap.web2.server.admin.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;
import wap.web2.server.member.entity.MemberType;
import wap.web2.server.member.entity.Role;

public record UserAttributesChangeRequest(
    @NotEmpty List<@NotNull @Positive Long> userIds,
    Role role,
    MemberType memberType
) {
    @AssertTrue(message = "변경할 권한 또는 LEVEL을 선택해주세요.")
    @JsonIgnore
    public boolean isChangeProvided() {
        return role != null || memberType != null;
    }

    @AssertTrue(message = "권한은 게스트, 회원, 임원 중에서 선택해주세요.")
    @JsonIgnore
    public boolean isRoleAllowed() {
        return role == null || role == Role.ROLE_GUEST || role == Role.ROLE_MEMBER || role == Role.ROLE_ADMIN;
    }
}
