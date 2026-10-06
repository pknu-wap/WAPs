package wap.web2.server.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springdoc.webmvc.api.OpenApiWebMvcResource;
import org.springdoc.webmvc.ui.SwaggerWelcomeWebMvc;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import wap.web2.server.global.security.CustomUserDetailsService;
import wap.web2.server.global.security.config.SecurityConfig;
import wap.web2.server.global.security.handler.OAuth2AuthenticationFailureHandler;
import wap.web2.server.global.security.handler.OAuth2AuthenticationSuccessHandler;
import wap.web2.server.global.security.handler.RestAccessDeniedHandler;
import wap.web2.server.global.security.handler.RestAuthenticationEntryPoint;
import wap.web2.server.global.security.handler.SecurityErrorResponseWriter;
import wap.web2.server.global.security.jwt.TokenProvider;
import wap.web2.server.global.security.oauth2.CustomOAuth2UserService;
import wap.web2.server.global.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;

class SwaggerAccessTest {
    private static final String[] DOCUMENT_PATHS = {
        "/swagger-ui/index.html",
        "/swagger-ui/swagger-ui.css",
        "/swagger-ui/swagger-ui-bundle.js",
        "/v3/api-docs",
        "/v3/api-docs.yaml",
        "/v3/api-docs/swagger-config",
        "/openapi.yaml"
    };

    private final WebApplicationContextRunner context = new WebApplicationContextRunner()
        .withInitializer(new ConfigDataApplicationContextInitializer())
        .withPropertyValues(
            "SERVER_URL=http://localhost",
            "KAKAO_REST_API_KEY=test",
            "KAKAO_CLIENT_SECRET=test"
        )
        .withUserConfiguration(TestApplication.class)
        .withBean(CustomUserDetailsService.class, () -> mock(CustomUserDetailsService.class))
        .withBean(CustomOAuth2UserService.class, () -> mock(CustomOAuth2UserService.class))
        .withBean(OAuth2AuthenticationSuccessHandler.class, () -> mock(OAuth2AuthenticationSuccessHandler.class))
        .withBean(OAuth2AuthenticationFailureHandler.class, () -> mock(OAuth2AuthenticationFailureHandler.class))
        .withBean(HttpCookieOAuth2AuthorizationRequestRepository.class, () -> mock(HttpCookieOAuth2AuthorizationRequestRepository.class))
        .withBean(TokenProvider.class, () -> mock(TokenProvider.class));

    @TestConfiguration(proxyBeanMethods = false)
    @EnableAutoConfiguration(exclude = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class,
        FlywayAutoConfiguration.class
    })
    @Import({
        SecurityConfig.class, SwaggerConfig.class, RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class, SecurityErrorResponseWriter.class
    })
    static class TestApplication {}

    @ParameterizedTest
    @ValueSource(strings = {"main", "oracle,develop,main"})
    void mainServesSwaggerAndApiDocumentsWithoutAuthentication(String profiles) {
        context.withPropertyValues("SPRING_PROFILES_ACTIVE=" + profiles).run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            for (String path : DOCUMENT_PATHS) {
                mvc.perform(get(path)).andExpect(status().isOk());
            }
            mvc.perform(get("/swagger-ui.html")).andExpect(status().is3xxRedirection());
        });
    }

    @ParameterizedTest
    @ValueSource(strings = {"oracle,production", "oracle,develop,production"})
    void productionDisablesSwaggerAndDeniesDocumentsEvenForAdmins(String profiles) {
        context.withPropertyValues("SPRING_PROFILES_ACTIVE=" + profiles).run(ctx -> {
            assertThat(ctx).doesNotHaveBean(OpenApiWebMvcResource.class);
            assertThat(ctx).doesNotHaveBean(SwaggerWelcomeWebMvc.class);
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            for (String path : DOCUMENT_PATHS) {
                mvc.perform(get(path)).andExpect(status().isUnauthorized());
                mvc.perform(get(path).with(user("admin").roles("ADMIN")))
                    .andExpect(status().isForbidden());
            }
            for (String path : new String[] {
                "/swagger-ui.html", "/swagger-resources", "/swagger-resources/configuration/ui",
                "/webjars/swagger-ui/index.html"
            }) {
                mvc.perform(get(path)).andExpect(status().isUnauthorized());
                mvc.perform(get(path).with(user("admin").roles("ADMIN")))
                    .andExpect(status().isForbidden());
            }
        });
    }
}
