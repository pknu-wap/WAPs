package wap.web2.server.attendance.controller;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import wap.web2.server.admin.controller.AdminAttendanceController;
import wap.web2.server.attendance.dto.AttendanceRequests;
import wap.web2.server.attendance.dto.AttendanceResponses.*;
import wap.web2.server.attendance.entity.AttendanceStatus;
import wap.web2.server.attendance.entity.PresenceStatus;
import wap.web2.server.attendance.service.AttendanceService;
import wap.web2.server.exception.GlobalExceptionHandler;
import wap.web2.server.global.security.CustomUserDetailsService;
import wap.web2.server.global.security.config.SecurityConfig;
import wap.web2.server.global.security.handler.*;
import wap.web2.server.global.security.jwt.TokenProvider;
import wap.web2.server.global.security.oauth2.CustomOAuth2UserService;
import wap.web2.server.global.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;

class AttendanceControllerTest {
    private final AttendanceService service = mock(AttendanceService.class);
    private final WebApplicationContextRunner context = new WebApplicationContextRunner()
        .withPropertyValues(
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
        .withBean(AttendanceService.class, () -> service)
        .withBean(CustomUserDetailsService.class, () -> mock(CustomUserDetailsService.class))
        .withBean(CustomOAuth2UserService.class, () -> mock(CustomOAuth2UserService.class))
        .withBean(OAuth2AuthenticationSuccessHandler.class, () -> mock(OAuth2AuthenticationSuccessHandler.class))
        .withBean(OAuth2AuthenticationFailureHandler.class, () -> mock(OAuth2AuthenticationFailureHandler.class))
        .withBean(HttpCookieOAuth2AuthorizationRequestRepository.class, () -> mock(HttpCookieOAuth2AuthorizationRequestRepository.class))
        .withBean(TokenProvider.class, () -> mock(TokenProvider.class));

    @TestConfiguration(proxyBeanMethods = false)
    @EnableAutoConfiguration(exclude = {DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class, FlywayAutoConfiguration.class})
    @Import({SecurityConfig.class, AdminAttendanceController.class, GlobalExceptionHandler.class,
        RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class, SecurityErrorResponseWriter.class})
    static class TestApplication {}

    @Test
    void adminEndpointsRequireAuthenticationAndAdminRole() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            for (var request : List.of(get("/admin/attendances"), post("/admin/attendances"),
                get("/admin/attendances/1"), patch("/admin/attendances/1/users/10"))) {
                mvc.perform(request).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("AUTH_UNAUTHORIZED"));
                mvc.perform(request.with(user("member").roles("MEMBER"))).andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN"));
            }
            verifyNoInteractions(service);
        });
    }

    @Test
    void validatesStrictRequestBodiesEnumsAndPositiveIds() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            for (String body : List.of("{}", "null", "[]", "{\"title\":\" \u3000 \",\"date\":\"2026-10-10\"}",
                "{\"title\":\"발표\",\"date\":\"2026-02-30\"}", "{\"title\":\"발표\",\"date\":\"2026-1-1\"}",
                "{\"title\":null,\"date\":\"2026-10-10\"}", "{\"title\":123,\"date\":\"2026-10-10\"}",
                "{\"title\":\"발표\",\"date\":[2026,10,10]}",
                "{\"title\":\"발표\",\"date\":\"2026-10-10\",\"extra\":true}",
                "{\"title\":\"" + "가".repeat(101) + "\",\"date\":\"2026-10-10\"}")) {
                mvc.perform(post("/admin/attendances").with(user("admin").roles("ADMIN"))
                    .contentType("application/json").content(body)).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("COMMON_INVALID_INPUT"));
            }
            for (String body : List.of("{}", "{\"status\":null}", "{\"note\":null}", "{\"status\":0}",
                "{\"status\":\"LATE\"}", "{\"note\":1}", "{\"note\":\"\",\"extra\":true}",
                "{\"note\":\"" + "가".repeat(501) + "\"}")) {
                mvc.perform(patch("/admin/attendances/1/users/10").with(user("admin").roles("ADMIN"))
                    .contentType("application/json").content(body)).andExpect(status().isBadRequest());
            }
            for (String path : List.of("/admin/attendances?status=INVALID", "/admin/attendances/1?status=ONGOING",
                "/admin/attendances/0", "/admin/attendances/not-a-number")) {
                mvc.perform(get(path).with(user("admin").roles("ADMIN"))).andExpect(status().isBadRequest());
            }
            mvc.perform(patch("/admin/attendances/1/users/0").with(user("admin").roles("ADMIN"))
                .contentType("application/json").content("{\"note\":\"\"}")).andExpect(status().isBadRequest());
            verifyNoInteractions(service);
        });
    }

    @Test
    void serializesAdminResponsesAndPreservesPatchOmissions() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            var summary = new Summary(1L, "발표", LocalDate.of(2026, 10, 10), AttendanceStatus.ONGOING, 1, 0, 1);
            var participant = new Participant(10L, "가", PresenceStatus.ABSENT, null, "");
            when(service.create(any())).thenReturn(summary);
            when(service.listAdmin(null)).thenReturn(new Content<>(List.of(summary)));
            when(service.detail(1, null, "userName,asc")).thenReturn(new Detail(summary, new Content<>(List.of(participant))));
            when(service.update(anyLong(), anyLong(), any())).thenReturn(participant);
            mvc.perform(post("/admin/attendances").with(user("admin").roles("ADMIN"))
                .contentType("application/json").content("{\"title\":\"  발표  \",\"date\":\"2026-10-10\"}"))
                .andExpect(status().isCreated()).andExpect(header().string("Location", "/admin/attendances/1"))
                .andExpect(jsonPath("$.date").value("2026-10-10"));
            verify(service).create(new AttendanceRequests.Create("발표", LocalDate.of(2026, 10, 10)));
            mvc.perform(get("/admin/attendances").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].absentCount").value(1));
            mvc.perform(get("/admin/attendances/1").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.attendanceId").value(1))
                .andExpect(jsonPath("$.summary").doesNotExist())
                .andExpect(jsonPath("$.participants.content[0].checkedInAt").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.participants.content[0].note").value(""));
            mvc.perform(patch("/admin/attendances/1/users/10").with(user("admin").roles("ADMIN"))
                .contentType("application/json").content("{\"note\":\"\"}")).andExpect(status().isOk());
            verify(service).update(1, 10, new AttendanceRequests.Update(null, ""));
            mvc.perform(patch("/admin/attendances/1/users/10").with(user("admin").roles("ADMIN"))
                .contentType("application/json").content("{\"status\":\"PRESENT\"}")).andExpect(status().isOk());
            verify(service).update(1, 10, new AttendanceRequests.Update(PresenceStatus.PRESENT, null));
        });
    }
}
