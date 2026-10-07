package wap.web2.server.attendance.dto;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import wap.web2.server.attendance.entity.AttendanceParticipant;
import wap.web2.server.attendance.entity.AttendanceStatus;
import wap.web2.server.attendance.entity.PresenceStatus;

public final class AttendanceResponses {
    private AttendanceResponses() {}

    public record Content<T>(List<T> content) {}

    public record Summary(Long attendanceId, String title, LocalDate date, AttendanceStatus status,
                          long totalCount, long presentCount, long absentCount) {}

    public record Detail(@JsonUnwrapped Summary summary, Content<Participant> participants) {}

    public record Qr(Long attendanceId, String qrToken, Instant expiresAt) {}

    public record CheckIn(Long attendanceId, Long userId, PresenceStatus status, Instant checkedInAt) {}

    public record MyAttendance(Long attendanceId, String title, LocalDate date, AttendanceStatus status,
                               PresenceStatus myStatus, Instant checkedInAt) {}

    public record Participant(Long userId, String userName, PresenceStatus status, Instant checkedInAt, String note) {
        public static Participant from(AttendanceParticipant participant) {
            return new Participant(participant.getUserId(), participant.getUserName(), participant.getStatus(),
                participant.getCheckedInAt(), participant.getNote());
        }
    }
}
