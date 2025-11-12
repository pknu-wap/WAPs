package wap.web2.server.admin.dto;

import java.time.LocalDateTime;
import software.amazon.awssdk.annotations.NotNull;

public record CalendarEventPostingRequest(
        @NotNull
        String title,
        @NotNull
        String content,
        @NotNull
        String target,
        @NotNull
        String location,
        @NotNull
        LocalDateTime dateTime
) {

}
