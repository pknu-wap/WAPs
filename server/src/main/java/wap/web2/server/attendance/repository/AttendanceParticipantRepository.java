package wap.web2.server.attendance.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wap.web2.server.attendance.entity.AttendanceParticipant;
import wap.web2.server.attendance.entity.AttendanceStatus;

public interface AttendanceParticipantRepository extends JpaRepository<AttendanceParticipant, Long> {
    List<AttendanceParticipant> findByAttendanceId(long attendanceId);

    Optional<AttendanceParticipant> findByAttendanceIdAndUserId(long attendanceId, long userId);

    @Query("""
        select count(p.id) as totalCount,
            coalesce(sum(case when p.status = wap.web2.server.attendance.entity.PresenceStatus.PRESENT then 1 else 0 end), 0) as presentCount
        from AttendanceParticipant p where p.attendance.id = :attendanceId
        """)
    Counts countForAttendance(@Param("attendanceId") long attendanceId);

    @Modifying
    @Query("delete from AttendanceParticipant p where p.attendance.id = :attendanceId")
    void deleteByAttendanceId(@Param("attendanceId") long attendanceId);

    @Query("""
        select p from AttendanceParticipant p join fetch p.attendance a
        where p.userId = :userId and a.status = :status
        order by a.date desc, a.id desc
        """)
    List<AttendanceParticipant> findAllForUser(@Param("userId") long userId, @Param("status") AttendanceStatus status);

    interface Counts {
        long getTotalCount();
        long getPresentCount();
    }
}
