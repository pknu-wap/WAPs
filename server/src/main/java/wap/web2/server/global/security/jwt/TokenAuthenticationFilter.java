package wap.web2.server.global.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import wap.web2.server.exception.ErrorCode;
import wap.web2.server.global.security.CustomUserDetailsService;
import wap.web2.server.global.security.handler.SecurityErrorResponseWriter;

@Slf4j
@RequiredArgsConstructor
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final TokenProvider tokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String jwt = getJwtFromRequest(request);

        if (StringUtils.hasText(jwt)) {
            ErrorCode tokenErrorCode = tokenProvider.getAccessTokenErrorCode(jwt);
            if (tokenErrorCode != null) {
                log.warn("JWT 인증에 실패했습니다. path={}, code={}", request.getRequestURI(), tokenErrorCode.getCode());
                request.setAttribute(SecurityErrorResponseWriter.ERROR_CODE_REQUEST_ATTRIBUTE, tokenErrorCode);
                request.setAttribute(SecurityErrorResponseWriter.ERROR_MESSAGE_REQUEST_ATTRIBUTE, tokenErrorCode.getDefaultMessage());
                SecurityContextHolder.clearContext();
            } else {
                try {
                    Long userId = tokenProvider.getUserIdFromToken(jwt);
                    UserDetails userDetails = customUserDetailsService.loadUserById(userId);
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } catch (Exception exception) {
                    log.error("JWT 인증 처리 중 오류가 발생했습니다. path={}", request.getRequestURI(), exception);
                    request.setAttribute(SecurityErrorResponseWriter.ERROR_CODE_REQUEST_ATTRIBUTE, ErrorCode.AUTH_UNAUTHORIZED);
                    request.setAttribute(
                            SecurityErrorResponseWriter.ERROR_MESSAGE_REQUEST_ATTRIBUTE,
                            ErrorCode.AUTH_UNAUTHORIZED.getDefaultMessage()
                    );
                    SecurityContextHolder.clearContext();
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
