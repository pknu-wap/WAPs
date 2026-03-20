package wap.web2.server.global.security.handler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import wap.web2.server.exception.ErrorCode;

@Component
@Slf4j
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final SecurityErrorResponseWriter securityErrorResponseWriter;

    @Override
    public void commence(HttpServletRequest httpServletRequest,
                         HttpServletResponse httpServletResponse,
                         AuthenticationException e) throws IOException, ServletException {
        ErrorCode errorCode = resolveErrorCode(httpServletRequest);
        String message = resolveMessage(httpServletRequest, errorCode);

        log.warn("인증에 실패했습니다. path={}, code={}", httpServletRequest.getRequestURI(), errorCode.getCode(), e);
        securityErrorResponseWriter.write(httpServletRequest, httpServletResponse, errorCode, message);
    }

    private ErrorCode resolveErrorCode(HttpServletRequest request) {
        Object errorCode = request.getAttribute(SecurityErrorResponseWriter.ERROR_CODE_REQUEST_ATTRIBUTE);
        if (errorCode instanceof ErrorCode value) {
            return value;
        }
        return ErrorCode.AUTH_UNAUTHORIZED;
    }

    private String resolveMessage(HttpServletRequest request, ErrorCode errorCode) {
        Object message = request.getAttribute(SecurityErrorResponseWriter.ERROR_MESSAGE_REQUEST_ATTRIBUTE);
        if (message instanceof String value && !value.isBlank()) {
            return value;
        }
        return errorCode.getDefaultMessage();
    }
}
