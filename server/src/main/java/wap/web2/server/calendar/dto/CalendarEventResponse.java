package wap.web2.server.calendar.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import wap.web2.server.calendar.entity.CalendarEvent;

public record CalendarEventResponse(
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm")
        LocalDateTime date,
        String title,
        String content,
        String target
) {

    public static CalendarEventResponse from(CalendarEvent event) {
        return new CalendarEventResponse(
                event.getDate(),
                event.getTitle(),
                event.getContent(),
                event.getTarget()
        );
    }

}
