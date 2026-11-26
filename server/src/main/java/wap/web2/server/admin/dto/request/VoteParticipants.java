package wap.web2.server.admin.dto.request;

import java.util.Set;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import static wap.web2.server.vote.service.VotePolicy.REQUIRED_VOTE_COUNT;

public record VoteParticipants(
    @NotNull @Size(min = REQUIRED_VOTE_COUNT) Set<@NotNull @Positive Long> projectIds
) {}
