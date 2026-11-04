package wap.web2.server.admin.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;
import wap.web2.server.member.entity.MembershipLevel;

public record MembershipLevelChangeRequest(
    @NotNull MembershipLevel newMembershipLevel,
    @NotNull List<@NotNull @Positive Long> userIds
) {}
