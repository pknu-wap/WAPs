package wap.web2.server.global.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import wap.web2.server.exception.ErrorCode;
import wap.web2.server.exception.ErrorResponse;
import wap.web2.server.exception.FieldErrorResponse;

@Component
@RequiredArgsConstructor
public class SecurityErrorResponseWriter {

    public static final String ERROR_CODE_REQUEST_ATTRIBUTE = "security.errorCode";
    public static final String ERROR_MESSAGE_REQUEST_ATTRIBUTE = "security.errorMessage";

    private final ObjectMapper objectMapper;

    public void write(
            HttpServletRequest request,
            HttpServletResponse response,
            ErrorCode errorCode,
            String message
    ) throws IOException {
        ErrorResponse errorResponse = ErrorResponse.of(
                errorCode,
                message,
                request.getRequestURI(),
                List.<FieldErrorResponse>of(),
                extractRequestId(request)
        );

        response.setStatus(errorCode.getHttpStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getWriter(), errorResponse);
    }

    private String extractRequestId(HttpServletRequest request) {
        String requestId = request.getHeader("X-Request-Id");
        return requestId == null || requestId.isBlank() ? null : requestId;
    }
}
