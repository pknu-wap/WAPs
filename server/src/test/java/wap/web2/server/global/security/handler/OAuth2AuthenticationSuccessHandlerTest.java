package wap.web2.server.global.security.handler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import wap.web2.server.auth.RefreshTokenRepository;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.global.security.config.AppProperties;
import wap.web2.server.global.security.jwt.TokenProvider;
import wap.web2.server.global.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;
import wap.web2.server.member.repository.UserRepository;

class OAuth2AuthenticationSuccessHandlerTest {

    private final AppProperties properties = new AppProperties();

    @BeforeEach
    void loadConfiguredRedirectUris() {
        var yaml = new YamlPropertiesFactoryBean();
        yaml.setResources(new ClassPathResource("application.yml"));
        var redirects = new Binder(new MapConfigurationPropertySource(yaml.getObject()))
            .bind("app.oauth2.authorized-redirect-uris", Bindable.listOf(String.class)).get();
        properties.getOauth2().authorizedRedirectUris(redirects);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "https://feat-698-allow-preview-domains.dev.waps.im/oauth/callback",
        "https://a1b2c3.dev.waps.im/oauth/callback",
        "https://FEAT-698.DEV.WAPS.IM/oauth/callback",
        "https://waps.im/oauth/callback", "https://dev.waps.im/oauth/callback",
        "https://wapst.netlify.app/oauth/callback", "https://waps-deploy.netlify.app/oauth/callback",
        "https://waps-web.netlify.app/oauth/callback", "https://waps-develop.netlify.app/oauth/callback",
        "http://localhost:3000/oauth/callback",
        "myandroidapp://oauth2/redirect", "myiosapp://oauth2/redirect"
    })
    void acceptsPreviewAndExistingRedirects(String uri) {
        assertThat(determineTargetUrl(uri)).isEqualTo(uri);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "http://feat-698.dev.waps.im/oauth/callback",
        "https://feat-698.dev.waps.im:8443/oauth/callback",
        "https://feat-698.dev.waps.im.evil.example/oauth/callback",
        "https://feat-698-dev.waps.im/oauth/callback",
        "https://feat-698.waps.im/oauth/callback",
        "https://feat-698.dev.waps.im@evil.example/oauth/callback",
        "https://evil.example/oauth/callback",
        "//feat-698.dev.waps.im/oauth/callback",
        "/oauth/callback", "https:///oauth/callback",
        "http://waps.im/oauth/callback", "https://localhost:3000/oauth/callback"
    })
    void rejectsRedirectsOutsideAllowedOrigins(String uri) {
        assertThatThrownBy(() -> determineTargetUrl(uri)).isInstanceOf(BadRequestException.class);
    }

    private String determineTargetUrl(String uri) {
        var handler = new OAuth2AuthenticationSuccessHandler(
            mock(TokenProvider.class), properties,
            mock(HttpCookieOAuth2AuthorizationRequestRepository.class),
            mock(UserRepository.class), mock(RefreshTokenRepository.class)
        );
        var request = new MockHttpServletRequest("GET", "/oauth2/callback/kakao");
        request.setCookies(new Cookie("redirect_uri", uri));
        return handler.determineTargetUrl(request, new MockHttpServletResponse(), null);
    }
}
