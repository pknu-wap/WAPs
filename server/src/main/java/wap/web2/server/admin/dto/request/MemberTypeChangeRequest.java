package wap.web2.server.admin.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;
import wap.web2.server.member.entity.MemberType;

public record MemberTypeChangeRequest(
    @NotNull MemberType memberType,
    @NotEmpty List<@NotNull @Positive Long> userIds
) {}
