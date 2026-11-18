package wap.web2.server.member.dto;

import jakarta.validation.constraints.NotNull;

public record UserRegistrationRequest(@NotNull Boolean wapMember, String name, String studentId) {}
