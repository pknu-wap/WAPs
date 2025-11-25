package wap.web2.server.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record CalendarEventPostingRequest(
        @NotBlank
        @Size(max = 30)
        String title,
        @NotBlank
        @Size(max = 2000)
        String content,
        @NotBlank
        @Size(max = 30)
        String target,
        @NotBlank
        @Size(max = 30)
        String location,
        @NotNull
        LocalDateTime dateTime
) {

}
