package wap.web2.server.global.security.oauth2;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import wap.web2.server.member.entity.*;
import wap.web2.server.member.repository.UserRepository;

class CustomOAuth2UserServiceTest {
    private final UserRepository repository = mock(UserRepository.class);
    private final CustomOAuth2UserService service = new CustomOAuth2UserService(repository);

    @Test
    void unknownKakaoAccountStartsPendingSignup() {
        when(repository.save(any(User.class))).thenAnswer(invocation -> {
            User account = invocation.getArgument(0);
            account.setId(1L);
            assertThat(account.isSignupCompleted()).isFalse();
            assertThat(account.getRole()).isEqualTo(Role.ROLE_GUEST);
            assertThat(account.getProviderId()).isEqualTo("1234");
            return account;
        });
        login();
        verify(repository).save(any(User.class));
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void knownKakaoAccountRetainsSignupStateAndEnteredIdentity(boolean completed) {
        var account = new User();
        account.setId(1L);
        account.setProvider(AuthProvider.kakao);
        account.setRole(Role.ROLE_GUEST);
        account.setName("직접 입력한 이름");
        account.setSignupCompleted(completed);
        when(repository.findByEmail("test@example.com")).thenReturn(Optional.of(account));
        login();
        assertThat(account.isSignupCompleted()).isEqualTo(completed);
        assertThat(account.getName()).isEqualTo("직접 입력한 이름");
        verify(repository, never()).save(any());
    }

    @Test
    void verifiedEmailRestoresIdentityWithoutRestoringPrivileges() {
        var account = deletedAccount();
        login(true);
        assertThat(account.isDeleted()).isFalse();
        assertThat(account.getId()).isEqualTo(42L);
        assertThat(account.getTokenVersion()).isEqualTo(2);
        assertThat(account.getRole()).isEqualTo(Role.ROLE_GUEST);
        assertThat(account.getMembershipLevel()).isEqualTo(MembershipLevel.NONE);
        assertThat(account.isSignupCompleted()).isFalse();
        assertThat(account.getPassword()).isNull();
    }

    @Test
    void unverifiedEmailCannotRestoreDeletedAccount() {
        var account = deletedAccount();
        assertThatThrownBy(() -> login(false)).isInstanceOf(
            org.springframework.security.core.AuthenticationException.class);
        assertThat(account.isDeleted()).isTrue();
        verify(repository, never()).save(any());
    }

    private User deletedAccount() {
        var account = new User();
        account.setId(42L);
        account.setProvider(AuthProvider.local);
        account.setRole(Role.ROLE_ADMIN);
        account.setMembershipLevel(MembershipLevel.REGULAR);
        account.setPassword("old-password-hash");
        account.deactivate();
        when(repository.findByEmail("test@example.com")).thenReturn(Optional.of(account));
        when(repository.findByIdForUpdate(42L)).thenReturn(Optional.of(account));
        when(repository.save(account)).thenReturn(account);
        return account;
    }

    private void login() { login(false); }

    private void login(boolean verified) {
        var rest = new RestTemplate();
        var server = MockRestServiceServer.bindTo(rest).build();
        service.setRestOperations(rest);
        server.expect(requestTo("https://kakao.example/userinfo")).andRespond(withSuccess("""
            {"id":1234,"properties":{"nickname":"카카오 이름","profile_image":"image"},
             "kakao_account":{"email":"test@example.com","is_email_verified":%s,"is_email_valid":%s}}
            """.formatted(verified, verified), MediaType.APPLICATION_JSON));
        var registration = ClientRegistration.withRegistrationId("kakao")
            .clientId("test").authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri("https://example.com/callback").authorizationUri("https://kakao.example/auth")
            .tokenUri("https://kakao.example/token").userInfoUri("https://kakao.example/userinfo")
            .userNameAttributeName("id").build();
        var token = new OAuth2AccessToken(OAuth2AccessToken.TokenType.BEARER, "test",
            Instant.now(), Instant.now().plusSeconds(60));
        service.loadUser(new OAuth2UserRequest(registration, token));
        server.verify();
    }
}
