package wap.web2.server.attendance.dto;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import wap.web2.server.attendance.entity.AttendanceParticipant;
import wap.web2.server.attendance.entity.AttendanceStatus;
import wap.web2.server.attendance.entity.PresenceStatus;

public final class AttendanceResponses {
    private AttendanceResponses() {}

    @Schema(requiredProperties = "content")
    public record Content<T>(List<T> content) {}

    @Schema(name = "AttendanceSummary", requiredProperties = {
        "attendanceId", "title", "date", "status", "totalCount", "presentCount", "absentCount"
    })
    public record Summary(
        @Schema(minimum = "1", example = "1") Long attendanceId,
        @Schema(example = "시작발표") String title,
        @Schema(description = "한국 시간 기준 출석 날짜 (YYYY-MM-DD)", example = "2026-10-10") LocalDate date,
        AttendanceStatus status,
        @Schema(description = "전체 대상자 수. presentCount + absentCount와 같습니다.", minimum = "0", example = "30") long totalCount,
        @Schema(minimum = "0", example = "20") long presentCount,
        @Schema(minimum = "0", example = "10") long absentCount
    ) {}

    @Schema(name = "AttendanceDetail", requiredProperties = "participants")
    public record Detail(@JsonUnwrapped Summary summary, Content<Participant> participants) {}

    @Schema(name = "AttendanceQrResponse", requiredProperties = {"attendanceId", "qrToken", "expiresAt"})
    public record Qr(
        @Schema(minimum = "1", example = "1") Long attendanceId,
        @Schema(description = "사용자 정보나 로그인 JWT를 포함하지 않는 출석 전용 난수", example = "example-attendance-qr-token") String qrToken,
        @Schema(description = "발급 시각으로부터 60초 후. 직전 토큰으로 보관되어도 연장되지 않으며, 서버 시각이 이 시각 이상이면 만료됩니다.", example = "2026-10-10T10:01:00Z") Instant expiresAt
    ) {}

    @Schema(name = "AttendanceCheckInResponse", requiredProperties = {"attendanceId", "userId", "status", "checkedInAt"})
    public record CheckIn(
        @Schema(minimum = "1", example = "1") Long attendanceId,
        @Schema(minimum = "1", example = "10") Long userId,
        @Schema(implementation = String.class, allowableValues = "PRESENT", example = "PRESENT") PresenceStatus status,
        @Schema(description = "최초 출석 처리 시각. 유효한 QR로 재요청하면 기존 시각을 반환합니다.", example = "2026-10-10T10:00:15Z") Instant checkedInAt
    ) {}

    @Schema(name = "MyAttendance", requiredProperties = {"attendanceId", "title", "date", "status", "myStatus", "checkedInAt"})
    public record MyAttendance(
        @Schema(minimum = "1", example = "1") Long attendanceId,
        @Schema(example = "시작발표") String title,
        @Schema(description = "한국 시간 기준 출석 날짜 (YYYY-MM-DD)", example = "2026-10-10") LocalDate date,
        AttendanceStatus status,
        PresenceStatus myStatus,
        @Schema(description = "출석 처리 시각. 미출석이면 null입니다.", nullable = true, example = "2026-10-10T10:00:15Z") Instant checkedInAt
    ) {}

    @Schema(name = "AttendanceParticipant", requiredProperties = {"userId", "userName", "status", "checkedInAt", "note"})
    public record Participant(
        @Schema(minimum = "1", example = "10") Long userId,
        @Schema(example = "잔망루피") String userName,
        PresenceStatus status,
        @Schema(description = "출석 처리 시각. 미출석이면 null입니다.", nullable = true, example = "2026-10-10T10:00:15Z") Instant checkedInAt,
        @Schema(description = "관리자 비고. 비고가 없으면 빈 문자열입니다.", maxLength = 500) String note
    ) {
        public static Participant from(AttendanceParticipant participant) {
            return new Participant(participant.getUserId(), participant.getUserName(), participant.getStatus(),
                participant.getCheckedInAt(), participant.getNote());
        }
    }
}
