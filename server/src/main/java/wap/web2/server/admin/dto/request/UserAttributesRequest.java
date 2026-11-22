package wap.web2.server.admin.dto.request;

import jakarta.validation.constraints.*;
import java.util.List;
import wap.web2.server.member.entity.Role;

public record UserAttributesRequest(
    @NotEmpty @Size(max = 500) List<@NotNull @Positive Long> userIds,
    Role role,
    @Pattern(regexp = "UNDECIDED|NONE|NEW|ASSOCIATE|REGULAR") String memberType
) {
    @AssertTrue(message = "ROLE 또는 LEVEL을 선택해 주세요.")
    public boolean isChangePresent() { return role != null || memberType != null; }
}
