package wap.web2.server.attendance.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.Set;
import wap.web2.server.attendance.entity.AttendanceStatus;
import wap.web2.server.attendance.entity.PresenceStatus;
import wap.web2.server.exception.BadRequestException;

public final class AttendanceRequests {
    private AttendanceRequests() {}

    @Schema(name = "CreateAttendanceRequest", additionalProperties = Schema.AdditionalPropertiesValue.FALSE)
    public record Create(
        @Schema(description = "앞뒤 공백을 제거한 행사명. 공백만 입력할 수 없습니다.", example = "시작발표")
        @NotBlank @Size(min = 1, max = 100) String title,
        @Schema(description = "한국 시간(Asia/Seoul) 기준 오늘 또는 미래 날짜 (YYYY-MM-DD)", example = "2026-10-10")
        @NotNull LocalDate date
    ) {
        public Create {
            if (title != null) title = title.strip();
        }

        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static Create from(JsonNode body) {
            validateFields(body, Set.of("title", "date"));
            String date = text(body, "date");
            if (date != null && !date.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}")) {
                throw new BadRequestException("출석 날짜는 YYYY-MM-DD 형식이어야 합니다.");
            }
            return new Create(text(body, "title"), date == null ? null : LocalDate.parse(date));
        }
    }

    @Schema(name = "UpdateAttendanceStatusRequest", additionalProperties = Schema.AdditionalPropertiesValue.FALSE)
    public record ChangeStatus(
        @Schema(description = "변경할 출석체크 진행 상태. 날짜와 무관하게 지정한 상태를 유지합니다.", example = "ONGOING")
        @NotNull AttendanceStatus status
    ) {
        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static ChangeStatus from(JsonNode body) {
            validateFields(body, Set.of("status"));
            String status = text(body, "status");
            return new ChangeStatus(status == null ? null : AttendanceStatus.valueOf(status));
        }
    }

    @Schema(name = "UpdateAttendanceParticipantRequest", minProperties = 1,
        additionalProperties = Schema.AdditionalPropertiesValue.FALSE,
        description = "status와 note 중 하나 이상을 전송합니다. 생략한 필드는 유지하며 null은 허용하지 않습니다.")
    public record Update(
        @Schema(description = "변경할 출석 상태. 같은 상태이면 기존 출석 시각을 유지합니다.") PresenceStatus status,
        @Schema(description = "관리자 비고. 빈 문자열이면 비고를 지웁니다.", example = "QR 인식 오류로 관리자 확인 후 출석 처리")
        @Size(max = 500) String note
    ) {
        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static Update from(JsonNode body) {
            validateFields(body, Set.of("status", "note"));
            if (body.isEmpty()) throw new BadRequestException("status 또는 note를 입력해 주세요.");
            String status = text(body, "status");
            return new Update(status == null ? null : PresenceStatus.valueOf(status), text(body, "note"));
        }
    }

    @Schema(name = "AttendanceCheckInRequest", additionalProperties = Schema.AdditionalPropertiesValue.FALSE)
    public record CheckIn(
        @Schema(description = "스캔한 QR의 출석 전용 토큰. 로그인 JWT와 다릅니다.", example = "example-attendance-qr-token")
        @NotBlank @Size(min = 1, max = 512) String qrToken
    ) {
        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static CheckIn from(JsonNode body) {
            validateFields(body, Set.of("qrToken"));
            return new CheckIn(text(body, "qrToken"));
        }
    }

    // 이 API의 additionalProperties: false와 null/타입 제약만 적용한다.
    private static void validateFields(JsonNode body, Set<String> allowed) {
        if (!body.isObject()) throw new BadRequestException("요청 본문은 객체여야 합니다.");
        body.fieldNames().forEachRemaining(field -> {
            if (!allowed.contains(field)) throw new BadRequestException("허용되지 않은 필드입니다: " + field);
        });
    }

    private static String text(JsonNode body, String field) {
        JsonNode value = body.get(field);
        if (value == null) return null;
        if (!value.isTextual()) throw new BadRequestException(field + "는 문자열이어야 합니다.");
        return value.textValue();
    }
}
