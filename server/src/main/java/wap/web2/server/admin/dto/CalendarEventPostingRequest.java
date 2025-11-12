package wap.web2.server.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record CalendarEventPostingRequest(
        @NotBlank
        @Size(max = 20)
        String title,
        @NotBlank
        @Size(max = 500)
        String content,
        @NotBlank
        @Size(max = 20)
        String target,
        @NotBlank
        @Size(max = 20)
        String location,
        @NotNull
        LocalDateTime dateTime
) {

}
