package wap.web2.server.auth;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mock.web.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.context.request.*;
import wap.web2.server.auth.domain.RefreshToken;
import wap.web2.server.auth.dto.SignUpRequest;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.global.security.*;
import wap.web2.server.global.security.config.AppProperties;
import wap.web2.server.global.security.jwt.*;
import wap.web2.server.member.entity.*;
import wap.web2.server.member.repository.UserRepository;

class AccountRestorationTest {
    private final UserRepository users = mock(UserRepository.class);
    private final AppProperties properties = new AppProperties();
    private final User user = new User();

    private TokenProvider tokens() {
        properties.getAuth().setTokenSecret("test-secret-".repeat(8));
        properties.getAuth().setTokenExpirationMsec(60000);
        properties.getAuth().setRefreshTokenExpirationMsec(120000);
        return new TokenProvider(properties, mock(ObjectProvider.class));
    }

    private void account() {
        user.setId(42L);
        user.setEmail("member@example.com");
        user.setProvider(AuthProvider.local);
        user.setRole(Role.ROLE_ADMIN);
        when(users.findById(42L)).thenReturn(Optional.of(user));
        when(users.findByIdForUpdate(42L)).thenReturn(Optional.of(user));
        when(users.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(users.save(user)).thenReturn(user);
    }

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void localRecoveryRequiresOriginalPasswordAndPreservesId() {
        account();
        var encoder = new BCryptPasswordEncoder();
        user.setPassword(encoder.encode("original"));
        user.deactivate();
        var controller = new AuthController(null, encoder, users, tokens(), properties, null);
        var request = new SignUpRequest();
        request.setName("Restored member");
        request.setEmail(user.getEmail());
        request.setPassword("different");
        assertThatThrownBy(() -> controller.registerUser(request)).isInstanceOf(BadRequestException.class);
        assertThat(user.isDeleted()).isTrue();
        verify(users, never()).save(any());
        request.setPassword("original");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(new MockHttpServletRequest()));
        assertThat(controller.registerUser(request).getStatusCode().value()).isEqualTo(201);
        assertThat(user.getId()).isEqualTo(42L);
        assertThat(user.isDeleted()).isFalse();
        assertThat(user.getRole()).isEqualTo(Role.ROLE_GUEST);
        assertThat(user.getTokenVersion()).isEqualTo(2);
    }

    @Test
    void oldAccessAndRefreshTokensStayRevokedAfterRecovery() throws Exception {
        account();
        var provider = tokens();
        var principal = UserPrincipal.create(user);
        var authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        String oldAccess = provider.createToken(authentication);
        String oldRefresh = provider.createRefreshToken(authentication);
        user.deactivate();
        var details = new CustomUserDetailsService(users);
        assertThatThrownBy(() -> details.loadUserById(42L)).isInstanceOf(RuntimeException.class);
        user.reactivate();
        var filter = new TokenAuthenticationFilter(provider, details);
        var request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + oldAccess);
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        var refreshTokens = mock(RefreshTokenRepository.class);
        when(refreshTokens.findByToken(oldRefresh)).thenReturn(Optional.of(RefreshToken.of(user, oldRefresh, 120000)));
        var auth = new AuthService(provider, refreshTokens, users, properties);
        assertThatThrownBy(() -> auth.createNewToken(oldRefresh)).isInstanceOf(BadRequestException.class);
        verify(refreshTokens, never()).save(any());
        principal = UserPrincipal.create(user);
        authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + provider.createToken(authentication));
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
    }
}
