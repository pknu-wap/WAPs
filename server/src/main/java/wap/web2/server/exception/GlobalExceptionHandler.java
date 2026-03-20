package wap.web2.server.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestCookieException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
            BusinessException exception,
            HttpServletRequest request
    ) {
        ErrorCode errorCode = exception.getErrorCode();
        ErrorResponse response = ErrorResponse.of(
                errorCode,
                exception.getMessage(),
                request.getRequestURI(),
                List.of(),
                extractRequestId(request)
        );

        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(
            AuthenticationException exception,
            HttpServletRequest request
    ) {
        ErrorResponse response = ErrorResponse.of(
                ErrorCode.AUTH_UNAUTHORIZED,
                "이메일 또는 비밀번호를 확인해 주세요.",
                request.getRequestURI(),
                List.of(),
                extractRequestId(request)
        );

        return ResponseEntity.status(ErrorCode.AUTH_UNAUTHORIZED.getHttpStatus()).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        List<FieldErrorResponse> errors = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toFieldErrorResponse)
                .toList();

        return badRequest("입력값을 확인해 주세요.", request, errors);
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBindException(
            BindException exception,
            HttpServletRequest request
    ) {
        List<FieldErrorResponse> errors = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toFieldErrorResponse)
                .toList();

        return badRequest("요청 값을 확인해 주세요.", request, errors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolationException(
            ConstraintViolationException exception,
            HttpServletRequest request
    ) {
        List<FieldErrorResponse> errors = exception.getConstraintViolations()
                .stream()
                .map(this::toFieldErrorResponse)
                .toList();

        return badRequest("요청 값을 확인해 주세요.", request, errors);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingServletRequestParameterException(
            MissingServletRequestParameterException exception,
            HttpServletRequest request
    ) {
        String message = String.format("필수 요청 파라미터 '%s'가 없습니다.", exception.getParameterName());
        return badRequest(message, request, List.of());
    }

    @ExceptionHandler(MissingRequestCookieException.class)
    public ResponseEntity<ErrorResponse> handleMissingRequestCookieException(
            MissingRequestCookieException exception,
            HttpServletRequest request
    ) {
        String message = String.format("필수 쿠키 '%s'가 없습니다.", exception.getCookieName());
        return badRequest(message, request, List.of());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request
    ) {
        String message = String.format("요청 파라미터 '%s'의 형식이 올바르지 않습니다.", exception.getName());
        return badRequest(message, request, List.of());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(
            HttpMessageNotReadableException exception,
            HttpServletRequest request
    ) {
        return badRequest("요청 본문을 올바르게 읽을 수 없습니다.", request, List.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(
            Exception exception,
            HttpServletRequest request
    ) {
        logger.error("처리되지 않은 예외가 발생했습니다. path={}", request.getRequestURI(), exception);

        ErrorResponse response = ErrorResponse.of(
                ErrorCode.COMMON_INTERNAL_SERVER_ERROR,
                ErrorCode.COMMON_INTERNAL_SERVER_ERROR.getDefaultMessage(),
                request.getRequestURI(),
                List.of(),
                extractRequestId(request)
        );

        return ResponseEntity.internalServerError().body(response);
    }

    private ResponseEntity<ErrorResponse> badRequest(
            String message,
            HttpServletRequest request,
            List<FieldErrorResponse> errors
    ) {
        ErrorResponse response = ErrorResponse.of(
                ErrorCode.COMMON_INVALID_INPUT,
                message,
                request.getRequestURI(),
                errors,
                extractRequestId(request)
        );

        return ResponseEntity.badRequest().body(response);
    }

    private FieldErrorResponse toFieldErrorResponse(FieldError fieldError) {
        return new FieldErrorResponse(
                fieldError.getField(),
                Objects.requireNonNullElse(fieldError.getDefaultMessage(), "입력값을 확인해 주세요."),
                fieldError.getRejectedValue()
        );
    }

    private FieldErrorResponse toFieldErrorResponse(ConstraintViolation<?> violation) {
        return new FieldErrorResponse(
                extractFieldName(violation),
                violation.getMessage(),
                violation.getInvalidValue()
        );
    }

    private String extractFieldName(ConstraintViolation<?> violation) {
        String propertyPath = violation.getPropertyPath().toString();
        int lastDotIndex = propertyPath.lastIndexOf('.');
        if (lastDotIndex >= 0 && lastDotIndex < propertyPath.length() - 1) {
            return propertyPath.substring(lastDotIndex + 1);
        }
        return propertyPath;
    }

    private String extractRequestId(HttpServletRequest request) {
        String requestId = request.getHeader("X-Request-Id");
        return requestId == null || requestId.isBlank() ? null : requestId;
    }
}
