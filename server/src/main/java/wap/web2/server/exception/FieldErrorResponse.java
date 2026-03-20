package wap.web2.server.exception;

public record FieldErrorResponse(
        String field,
        String message,
        Object rejectedValue
) {
}
