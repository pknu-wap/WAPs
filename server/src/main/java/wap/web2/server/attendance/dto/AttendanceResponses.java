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

    public record Participant(Long userId, String userName, PresenceStatus status, Instant checkedInAt, String note) {
        public static Participant from(AttendanceParticipant participant) {
            return new Participant(participant.getUserId(), participant.getUserName(), participant.getStatus(),
                participant.getCheckedInAt(), participant.getNote());
        }
    }
}
