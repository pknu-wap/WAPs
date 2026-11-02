package wap.web2.server.config;

import static org.mockito.Mockito.mock;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import wap.web2.server.admin.controller.AdminUserController;
import wap.web2.server.admin.service.UserRoleService;
import wap.web2.server.exception.GlobalExceptionHandler;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import wap.web2.server.global.security.CustomUserDetailsService;
import wap.web2.server.global.security.config.SecurityConfig;
import wap.web2.server.global.security.handler.*;
import wap.web2.server.global.security.jwt.TokenProvider;
import wap.web2.server.global.security.oauth2.*;

class RoleAccessTest {
    private final WebApplicationContextRunner context = new WebApplicationContextRunner()
        .withPropertyValues(
            "swagger.server-url=http://localhost",
            "spring.security.oauth2.client.registration.test.client-id=test",
            "spring.security.oauth2.client.registration.test.client-secret=test",
            "spring.security.oauth2.client.registration.test.provider=test",
            "spring.security.oauth2.client.registration.test.authorization-grant-type=authorization_code",
            "spring.security.oauth2.client.registration.test.redirect-uri=http://localhost/callback",
            "spring.security.oauth2.client.provider.test.authorization-uri=http://localhost/authorize",
            "spring.security.oauth2.client.provider.test.token-uri=http://localhost/token",
            "spring.security.oauth2.client.provider.test.user-info-uri=http://localhost/user",
            "spring.security.oauth2.client.provider.test.user-name-attribute=id")
        .withUserConfiguration(TestApplication.class)
        .withBean(UserRoleService.class, () -> mock(UserRoleService.class))
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
        SecurityConfig.class, Endpoints.class, AdminUserController.class, GlobalExceptionHandler.class, RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class, SecurityErrorResponseWriter.class
    })
    static class TestApplication {}


    @RestController
    static class Endpoints {
        @RequestMapping({"/project", "/project/1", "/team-build/apply/submit",
            "/team-build/recruit/submit", "/vote", "/comment/1", "/user/role/ROLE_ADMIN", "/user/role"})
        String endpoint() { return "ok"; }
    }

    @ParameterizedTest
    @ValueSource(strings = {"GUEST", "MEMBER", "ADMIN"})
    void enforcesRolePermissions(String role) {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            var identity = user("user").roles(role);
            for (String path : new String[]{"/project/1", "/user/role"}) {
                mvc.perform(get(path).with(identity)).andExpect(status().isOk());
            }
            for (String path : new String[]{"/vote", "/comment/1"}) {
                mvc.perform(post(path).with(identity)).andExpect(status().isOk());
                mvc.perform(post(path)).andExpect(status().isUnauthorized());
            }
            for (String path : new String[]{"/project", "/team-build/apply/submit", "/team-build/recruit/submit"}) {
                mvc.perform(post(path).with(identity))
                    .andExpect(role.equals("GUEST") ? status().isForbidden() : status().isOk());
                mvc.perform(post(path)).andExpect(status().isUnauthorized());
            }
            mvc.perform(put("/project/1").with(identity))
                .andExpect(role.equals("GUEST") ? status().isForbidden() : status().isOk());
            mvc.perform(delete("/project/1").with(identity))
                .andExpect(role.equals("GUEST") ? status().isForbidden() : status().isOk());
            for (String path : new String[]{"/admin/role/user", "/admin/role/user/membership-level"}) {
                String body = path.endsWith("membership-level")
                    ? "{\"newMembershipLevel\":\"NEW\",\"userIds\":[1]}"
                    : "{\"newRole\":\"ROLE_MEMBER\",\"userIds\":[1]}";
                mvc.perform(patch(path).with(identity).contentType("application/json").content(body))
                    .andExpect(role.equals("ADMIN") ? status().isOk() : status().isForbidden());
            }
            mvc.perform(post("/user/role/ROLE_ADMIN").with(identity)).andExpect(status().isForbidden());
            mvc.perform(get("/user/role")).andExpect(status().isUnauthorized());
        });
    }
    @Test
    void rejectsInvalidMembershipUpdates() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            for (String body : new String[]{"{}", "{\"newMembershipLevel\":\"UNKNOWN\",\"userIds\":[1]}",
                "{\"newMembershipLevel\":\"NEW\",\"userIds\":[null]}",
                "{\"newMembershipLevel\":\"NEW\",\"userIds\":[-1]}"}) {
                mvc.perform(patch("/admin/role/user/membership-level").with(user("admin").roles("ADMIN"))
                    .contentType("application/json").content(body)).andExpect(status().isBadRequest());
            }
        });
    }

}
