package wap.web2.server.calendar.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import wap.web2.server.calendar.entity.CalendarEvent;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    List<CalendarEvent> findAllByIsExpiredFalseOrderByDateAsc();

}
