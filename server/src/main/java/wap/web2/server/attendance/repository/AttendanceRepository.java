package wap.web2.server.attendance.repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wap.web2.server.attendance.entity.Attendance;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Attendance a where a.id = :id")
    Optional<Attendance> findByIdForUpdate(@Param("id") long id);

    @Query("""
        select a.id as attendanceId, a.title as title, a.date as date,
            count(p.id) as totalCount,
            sum(case when p.status = wap.web2.server.attendance.entity.PresenceStatus.PRESENT then 1 else 0 end) as presentCount
        from Attendance a left join AttendanceParticipant p on p.attendance = a
        group by a.id, a.title, a.date
        order by a.date desc, a.id desc
        """)
    List<Counts> findAllWithCounts();

    interface Counts {
        Long getAttendanceId();
        String getTitle();
        LocalDate getDate();
        long getTotalCount();
        long getPresentCount();
    }
}
