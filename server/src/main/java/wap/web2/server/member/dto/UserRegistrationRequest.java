package wap.web2.server.member.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Profile edits are separate from the initial signup and never assign privileges. */
public record UserRegistrationRequest(
    @NotNull Boolean member,
    @Size(max = 4) String name,
    @Pattern(regexp = "[0-9]{2}") String studentNumber
) {}
