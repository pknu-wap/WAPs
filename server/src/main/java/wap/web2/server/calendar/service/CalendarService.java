package wap.web2.server.calendar.service;

import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.calendar.dto.CalendarEventResponse;
import wap.web2.server.calendar.entity.CalendarEvent;
import wap.web2.server.calendar.repository.CalendarEventRepository;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarEventRepository calendarEventRepository;

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> getActiveEvents() {
        LocalDateTime now = LocalDateTime.now();
        List<CalendarEvent> calendarEvents = calendarEventRepository.findByDateAfterOrderByDateAsc(now);

        return calendarEvents.stream()
                .map(CalendarEventResponse::from)
                .toList();
    }

}
