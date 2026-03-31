package wap.web2.server.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import wap.web2.server.global.security.UserPrincipal;

@Slf4j
@Component
public class RequestCorrelationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String requestId = resolveRequestId(request);
        long startTime = System.nanoTime();
        Throwable failure = null;

        request.setAttribute(RequestCorrelation.REQUEST_ID_ATTRIBUTE, requestId);
        response.setHeader(RequestCorrelation.REQUEST_ID_HEADER, requestId);
        MDC.put(RequestCorrelation.REQUEST_ID_MDC_KEY, requestId);

        try {
            filterChain.doFilter(request, response);
        } catch (ServletException | IOException | RuntimeException exception) {
            failure = exception;
            throw exception;
        } finally {
            int status = failure == null ? response.getStatus() : HttpServletResponse.SC_INTERNAL_SERVER_ERROR;
            long durationMs = (System.nanoTime() - startTime) / 1_000_000;

            log.info(
                    "http_request_completed method={} path={} status={} durationMs={} userId={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    status,
                    durationMs,
                    resolveUserId()
            );

            MDC.remove(RequestCorrelation.REQUEST_ID_MDC_KEY);
        }
    }

    private String resolveRequestId(HttpServletRequest request) {
        String requestId = request.getHeader(RequestCorrelation.REQUEST_ID_HEADER);
        return requestId == null || requestId.isBlank() ? UUID.randomUUID().toString() : requestId;
    }

    private String resolveUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "anonymous";
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return String.valueOf(userPrincipal.getId());
        }

        String name = authentication.getName();
        return name == null || name.isBlank() ? "anonymous" : name;
    }
}
