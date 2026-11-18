package wap.web2.server.admin.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UserDeleteRequest(
    @NotEmpty @Size(max = 1000) List<@NotNull @Positive Long> userIds
) {}
