package wap.web2.server.admin.dto.response;

import wap.web2.server.member.entity.MembershipLevel;

public record MembershipLevelChangeResponse(int updatedUserCount, MembershipLevel changeTo) {}
