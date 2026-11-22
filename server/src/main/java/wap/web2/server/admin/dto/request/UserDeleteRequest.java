package wap.web2.server.admin.dto.request;

import jakarta.validation.constraints.*;
import java.util.List;

public record UserDeleteRequest(
    @NotEmpty @Size(max = 500) List<@NotNull @Positive Long> userIds
) {}
