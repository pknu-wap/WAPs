package wap.web2.server.calendar.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import wap.web2.server.calendar.entity.Event;

public interface EventRepository extends JpaRepository<Long, Event> {

    List<Event> findAllByIsExpiredFalseOrderByDateAsc();

}
