package wap.web2.server.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
@Schema(description = "서버 공통 오류 응답. 비어 있는 선택 필드는 생략합니다.",
    requiredProperties = {"timestamp", "status", "code", "message", "path"})
public record ErrorResponse(
    @Schema(example = "2026-10-10T10:00:00Z") Instant timestamp,
    @Schema(example = "400") int status,
    @Schema(example = "COMMON_INVALID_INPUT") String code,
    @Schema(example = "잘못된 요청입니다.") String message,
    @Schema(example = "/admin/attendances") String path,
    List<FieldErrorResponse> errors,
    @Schema(description = "서버에서 제공하는 경우에만 포함되는 요청 추적 ID") String requestId
) {
    public ErrorResponse {
        timestamp = timestamp == null ? Instant.now() : timestamp;
        errors = errors == null ? List.of() : List.copyOf(errors);
    }

    public static ErrorResponse of(ErrorCode errorCode, String path) {
        return of(errorCode, errorCode.getDefaultMessage(), path);
    }

    public static ErrorResponse of(ErrorCode errorCode, String message, String path) {
        return of(errorCode, message, path, List.of(), null);
    }

    public static ErrorResponse of(
        ErrorCode errorCode,
        String message,
        String path,
        List<FieldErrorResponse> errors
    ) {
        return of(errorCode, message, path, errors, null);
    }

    public static ErrorResponse of(
        ErrorCode errorCode,
        String message,
        String path,
        List<FieldErrorResponse> errors,
        String requestId
    ) {
        return new ErrorResponse(
            Instant.now(),
            errorCode.getHttpStatus().value(),
            errorCode.getCode(),
            hasText(message) ? message : errorCode.getDefaultMessage(),
            path,
            errors,
            requestId
        );
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
