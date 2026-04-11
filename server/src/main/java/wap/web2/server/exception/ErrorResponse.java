package wap.web2.server.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ErrorResponse(
        Instant timestamp,
        int status,
        String code,
        String message,
        String path,
        List<FieldErrorResponse> errors,
        String requestId
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
