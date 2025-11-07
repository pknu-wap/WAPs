package wap.web2.server.calendar.dto;

import java.time.LocalDateTime;
import wap.web2.server.calendar.entity.CalendarEvent;

public record CalendarEventResponse(
        Long id,
        String title,
        String content,
        LocalDateTime date,
        String target
) {

    public static CalendarEventResponse from(CalendarEvent event) {
        return new CalendarEventResponse(
                event.getId(),
                event.getTitle(),
                event.getContent(),
                event.getDate(),
                event.getTarget()
        );
    }

}
