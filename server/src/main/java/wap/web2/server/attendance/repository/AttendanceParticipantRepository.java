package wap.web2.server.attendance.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wap.web2.server.attendance.entity.AttendanceParticipant;

public interface AttendanceParticipantRepository extends JpaRepository<AttendanceParticipant, Long> {
    List<AttendanceParticipant> findByAttendanceId(long attendanceId);

    Optional<AttendanceParticipant> findByAttendanceIdAndUserId(long attendanceId, long userId);

    @Query("""
        select p from AttendanceParticipant p join fetch p.attendance a
        where p.userId = :userId order by a.date desc, a.id desc
        """)
    List<AttendanceParticipant> findAllForUser(@Param("userId") long userId);
}
