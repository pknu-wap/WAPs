package wap.web2.server.admin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.admin.dto.request.CalendarEventPostingRequest;
import wap.web2.server.calendar.entity.CalendarEvent;
import wap.web2.server.calendar.repository.CalendarEventRepository;

@Service
@RequiredArgsConstructor
public class AdminCalendarService {

    private final CalendarEventRepository calendarEventRepository;

    // TODO: 엔티티에 location field 생성하여 분리 저장
    @Transactional
    public void postCalendarEvent(CalendarEventPostingRequest request) {
        CalendarEvent event = CalendarEvent.builder()
                .title(request.title())
                .content(request.content() + "\n" + request.location())
                .target(request.target())
                .date(request.dateTime())
                .build();

        calendarEventRepository.save(event);
    }

}
