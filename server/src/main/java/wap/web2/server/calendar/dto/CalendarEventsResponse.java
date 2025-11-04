package wap.web2.server.calendar.dto;

import java.time.LocalDateTime;
import wap.web2.server.calendar.entity.CalendarEvent;

public record CalendarEventsResponse(
        Long id,
        String title,
        String content,
        LocalDateTime date,
        String target
) {

    public static CalendarEventsResponse from(CalendarEvent event) {
        return new CalendarEventsResponse(
                event.getId(),
                event.getTitle(),
                event.getContent(),
                event.getDate(),
                event.getTarget()
        );
    }

}
