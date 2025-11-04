package wap.web2.server.calendar.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.calendar.entity.CalendarEvent;
import wap.web2.server.calendar.repository.EventRepository;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final EventRepository eventRepository;

    @Transactional(readOnly = true)
    public List<CalendarEvent> getActiveEvents() {
        return eventRepository.findAllByIsExpiredFalseOrderByDateAsc();
    }

}
