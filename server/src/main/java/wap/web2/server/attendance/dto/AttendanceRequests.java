package wap.web2.server.attendance.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.Set;
import wap.web2.server.attendance.entity.PresenceStatus;
import wap.web2.server.exception.BadRequestException;

public final class AttendanceRequests {
    private AttendanceRequests() {}

    public record Create(
        @NotBlank @Size(max = 100) String title,
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

    public record Update(PresenceStatus status, @Size(max = 500) String note) {
        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static Update from(JsonNode body) {
            validateFields(body, Set.of("status", "note"));
            if (body.isEmpty()) throw new BadRequestException("status 또는 note를 입력해 주세요.");
            String status = text(body, "status");
            return new Update(status == null ? null : PresenceStatus.valueOf(status), text(body, "note"));
        }
    }

    public record CheckIn(@NotBlank @Size(max = 512) String qrToken) {
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
