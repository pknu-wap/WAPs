package wap.web2.server.calendar.dto;

import java.time.LocalDateTime;
import wap.web2.server.calendar.entity.Event;

public record EventsResponse(
        Long id,
        String title,
        String content,
        LocalDateTime date,
        String target
) {

    public static EventsResponse from(Event event) {
        return new EventsResponse(
                event.getId(),
                event.getTitle(),
                event.getContent(),
                event.getDate(),
                event.getTarget()
        );
    }

}
