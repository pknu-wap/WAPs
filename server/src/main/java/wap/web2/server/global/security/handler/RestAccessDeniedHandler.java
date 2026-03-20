package wap.web2.server.global.security.handler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import wap.web2.server.exception.ErrorCode;

@Component
@Slf4j
@RequiredArgsConstructor
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final SecurityErrorResponseWriter securityErrorResponseWriter;

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException, ServletException {
        log.warn("인가에 실패했습니다. path={}", request.getRequestURI(), accessDeniedException);
        securityErrorResponseWriter.write(
                request,
                response,
                ErrorCode.AUTH_FORBIDDEN,
                ErrorCode.AUTH_FORBIDDEN.getDefaultMessage()
        );
    }
}
