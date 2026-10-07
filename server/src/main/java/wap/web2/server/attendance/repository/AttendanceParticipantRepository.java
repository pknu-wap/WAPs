package wap.web2.server.attendance.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wap.web2.server.attendance.entity.AttendanceParticipant;
import wap.web2.server.attendance.entity.AttendanceStatus;

public interface AttendanceParticipantRepository extends JpaRepository<AttendanceParticipant, Long> {
    List<AttendanceParticipant> findByAttendanceId(long attendanceId);

    Optional<AttendanceParticipant> findByAttendanceIdAndUserId(long attendanceId, long userId);

    @Query("""
        select p from AttendanceParticipant p join fetch p.attendance a
        where p.userId = :userId and a.status = :status
        order by a.date desc, a.id desc
        """)
    List<AttendanceParticipant> findAllForUser(@Param("userId") long userId, @Param("status") AttendanceStatus status);
}
