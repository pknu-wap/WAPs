package wap.web2.server.attendance.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
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
import wap.web2.server.config.SwaggerConfig;
import wap.web2.server.exception.GlobalExceptionHandler;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.exception.ConflictException;
import wap.web2.server.exception.ForbiddenException;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.global.security.CustomUserDetailsService;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.global.security.config.SecurityConfig;
import wap.web2.server.global.security.handler.*;
import wap.web2.server.global.security.jwt.TokenProvider;
import wap.web2.server.global.security.oauth2.CustomOAuth2UserService;
import wap.web2.server.global.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;

class AttendanceControllerTest {
    private final AttendanceService service = mock(AttendanceService.class);
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
        .withBean(AttendanceService.class, () -> service)
        .withBean(CustomUserDetailsService.class, () -> mock(CustomUserDetailsService.class))
        .withBean(CustomOAuth2UserService.class, () -> mock(CustomOAuth2UserService.class))
        .withBean(OAuth2AuthenticationSuccessHandler.class, () -> mock(OAuth2AuthenticationSuccessHandler.class))
        .withBean(OAuth2AuthenticationFailureHandler.class, () -> mock(OAuth2AuthenticationFailureHandler.class))
        .withBean(HttpCookieOAuth2AuthorizationRequestRepository.class, () -> mock(HttpCookieOAuth2AuthorizationRequestRepository.class))
        .withBean(TokenProvider.class, () -> mock(TokenProvider.class));

    @TestConfiguration(proxyBeanMethods = false)
    @EnableAutoConfiguration(exclude = {DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class, FlywayAutoConfiguration.class})
    @Import({SecurityConfig.class, SwaggerConfig.class, AdminAttendanceController.class, AttendanceController.class, GlobalExceptionHandler.class,
        RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class, SecurityErrorResponseWriter.class})
    static class TestApplication {}

    @Test
    void adminEndpointsRequireAuthenticationAndAdminRole() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            for (var request : List.of(get("/admin/attendances"), post("/admin/attendances"),
                get("/admin/attendances/1"), patch("/admin/attendances/1/users/10"), post("/admin/attendances/1/qr"))) {
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

    @Test
    void qrResponseIsNotCachedAndUserEndpointsOnlyUseTheAuthenticatedIdentity() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            var instant = Instant.parse("2026-10-10T10:00:00Z");
            when(service.issueQr(1)).thenReturn(new Qr(1L, "token", instant.plusSeconds(30)));
            mvc.perform(post("/admin/attendances/1/qr").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.qrToken").value("token"))
                .andExpect(jsonPath("$.expiresAt").value("2026-10-10T10:00:30Z"));
            mvc.perform(get("/attendances")).andExpect(status().isUnauthorized());
            mvc.perform(post("/attendances/1/check-in").contentType("application/json").content("{\"qrToken\":\"token\"}"))
                .andExpect(status().isUnauthorized());
            for (String role : List.of("GUEST", "USER", "MEMBER", "ADMIN")) {
                var principal = principal(role);
                when(service.listMine(10, AttendanceStatus.ONGOING)).thenReturn(List.of(
                    new MyAttendance(1L, "발표", LocalDate.of(2026, 10, 10), AttendanceStatus.ONGOING, PresenceStatus.ABSENT, null)));
                when(service.listMine(10, AttendanceStatus.ENDED)).thenReturn(List.of());
                when(service.checkIn(1, 10, "token")).thenReturn(new CheckIn(1L, 10L, PresenceStatus.PRESENT, instant));
                mvc.perform(get("/attendances?userId=99").with(user(principal)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$[0].myStatus").value("ABSENT"))
                    .andExpect(jsonPath("$[0].checkedInAt").value(org.hamcrest.Matchers.nullValue()))
                    .andExpect(jsonPath("$[0].note").doesNotExist());
                mvc.perform(get("/attendances?status=ENDED").with(user(principal)))
                    .andExpect(status().isOk()).andExpect(content().json("[]"));
                mvc.perform(post("/attendances/1/check-in?userId=99").with(user(principal))
                    .contentType("application/json").content("{\"qrToken\":\"token\"}"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.userId").value(10))
                    .andExpect(jsonPath("$.checkedInAt").value("2026-10-10T10:00:00Z"));
            }
            verify(service, times(4)).checkIn(1, 10, "token");
            verify(service, never()).listMine(eq(99L), any());
        });
    }

    @Test
    void checkInValidatesInputAndReturnsCommonErrors() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            var principal = principal("USER");
            for (String body : List.of("{}", "null", "{\"qrToken\":null}", "{\"qrToken\":123}",
                "{\"qrToken\":\"\"}", "{\"qrToken\":\" \"}", "{\"qrToken\":\"token\",\"userId\":99}",
                "{\"qrToken\":\"" + "a".repeat(513) + "\"}")) {
                mvc.perform(post("/attendances/1/check-in").with(user(principal))
                    .contentType("application/json").content(body)).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("COMMON_INVALID_INPUT"));
            }
            mvc.perform(post("/attendances/0/check-in").with(user(principal))
                .contentType("application/json").content("{\"qrToken\":\"token\"}"))
                .andExpect(status().isBadRequest());
            mvc.perform(get("/attendances?status=INVALID").with(user(principal))).andExpect(status().isBadRequest());
            verifyNoInteractions(service);
            when(service.listMine(10, AttendanceStatus.SCHEDULED)).thenThrow(new BadRequestException("예정 조회 불가"));
            mvc.perform(get("/attendances?status=SCHEDULED").with(user(principal))).andExpect(status().isBadRequest());
            var errors = List.of(new BadRequestException("QR 오류"), new ForbiddenException("대상자 아님"),
                new ResourceNotFoundException("없음"), new ConflictException("종료"));
            for (var error : errors) {
                when(service.checkIn(1, 10, "token")).thenThrow(error);
                mvc.perform(post("/attendances/1/check-in").with(user(principal))
                    .contentType("application/json").content("{\"qrToken\":\"token\"}"))
                    .andExpect(status().is(error.getErrorCode().getHttpStatus().value()))
                    .andExpect(jsonPath("$.code").value(error.getErrorCode().name()))
                    .andExpect(jsonPath("$.path").value("/attendances/1/check-in"));
                reset(service);
            }
        });
    }

    private UserPrincipal principal(String role) {
        return new UserPrincipal(10L, "user@example.com", "", List.of(
            new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role)));
    }

    @Test
    void generatedSwaggerPreservesTheAttendanceContract() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            var body = mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
            var document = ctx.getBean(ObjectMapper.class).readTree(body);
            var paths = document.path("paths");
            var schemas = document.at("/components/schemas");
            assertThat(document.at("/security/0/JWT").isArray()).isTrue();
            assertThat(document.at("/components/securitySchemes/JWT/scheme").asText()).isEqualTo("bearer");
            assertThat(body).doesNotContain("UserPrincipal");
            var operations = Map.of(
                "/admin/attendances", Map.of("get", "listAdminAttendances", "post", "createAttendance"),
                "/admin/attendances/{attendanceId}", Map.of("get", "getAttendanceDetail"),
                "/admin/attendances/{attendanceId}/users/{userId}", Map.of("patch", "updateAttendanceParticipant"),
                "/admin/attendances/{attendanceId}/qr", Map.of("post", "issueAttendanceQr"),
                "/attendances", Map.of("get", "listMyAttendances"),
                "/attendances/{attendanceId}/check-in", Map.of("post", "checkInAttendance"));
            operations.forEach((path, methods) -> methods.forEach((method, id) -> {
                var operation = paths.path(path).path(method);
                assertThat(operation.path("operationId").asText()).isEqualTo(id);
                assertThat(operation.path("tags").get(0).asText())
                    .isEqualTo(path.startsWith("/admin") ? "관리자 출석" : "사용자 출석");
                for (String code : List.of("400", "401")) {
                    assertThat(operation.at("/responses/" + code + "/content/application~1json/schema/$ref").asText())
                        .isEqualTo("#/components/schemas/ErrorResponse");
                }
                if (!path.equals("/attendances")) assertThat(operation.at("/responses/403").isMissingNode()).isFalse();
                if (path.contains("{attendanceId}")) assertThat(operation.at("/responses/404").isMissingNode()).isFalse();
            }));
            var create = paths.path("/admin/attendances").path("post");
            assertThat(create.at("/responses/201/headers/Location/schema/example").asText()).isEqualTo("/admin/attendances/1");
            assertThat(create.at("/responses/201/content/application~1json/schema/$ref").asText()).isEqualTo("#/components/schemas/AttendanceSummary");
            assertThat(create.at("/requestBody/content/application~1json/schema/$ref").asText()).isEqualTo("#/components/schemas/CreateAttendanceRequest");
            var createSchema = schemas.path("CreateAttendanceRequest");
            assertThat(createSchema.path("additionalProperties")).isEqualTo(ctx.getBean(ObjectMapper.class).valueToTree(false));
            assertThat(createSchema.path("required")).containsExactlyInAnyOrder(text("title"), text("date"));
            assertThat(createSchema.at("/properties/title/minLength").asInt()).isEqualTo(1);
            assertThat(createSchema.at("/properties/title/maxLength").asInt()).isEqualTo(100);
            assertThat(createSchema.at("/properties/date/format").asText()).isEqualTo("date");

            var listSchema = resolve(document, paths.path("/admin/attendances").at("/get/responses/200/content/application~1json/schema"));
            assertThat(listSchema.at("/properties/content/items/$ref").asText()).isEqualTo("#/components/schemas/AttendanceSummary");
            var detail = schemas.path("AttendanceDetail");
            assertThat(detail.path("properties").has("summary")).isFalse();
            for (String field : List.of("attendanceId", "title", "date", "status", "totalCount", "presentCount", "absentCount", "participants")) {
                assertThat(detail.path("properties").has(field)).as(field).isTrue();
                assertThat(detail.path("required")).contains(text(field));
            }
            var participants = resolve(document, detail.at("/properties/participants"));
            assertThat(participants.at("/properties/content/items/$ref").asText()).isEqualTo("#/components/schemas/AttendanceParticipant");
            assertThat(schemas.at("/AttendanceParticipant/properties/checkedInAt/nullable").asBoolean()).isTrue();
            assertThat(schemas.at("/AttendanceParticipant/properties/note/maxLength").asInt()).isEqualTo(500);
            var update = schemas.path("UpdateAttendanceParticipantRequest");
            assertThat(update.path("additionalProperties").isBoolean()).isTrue();
            assertThat(update.path("additionalProperties").asBoolean()).isFalse();
            assertThat(update.path("minProperties").asInt()).isEqualTo(1);
            assertThat(update.path("required").isMissingNode()).isTrue();

            var detailOperation = paths.path("/admin/attendances/{attendanceId}").path("get");
            assertThat(parameter(detailOperation, "sort").at("/schema/enum"))
                .containsExactly(text("userName,asc"), text("userName,desc"), text("status,asc"), text("status,desc"));
            assertThat(parameter(detailOperation, "sort").at("/schema/default").asText()).isEqualTo("userName,asc");
            var mine = paths.path("/attendances").path("get");
            assertThat(mine.path("parameters")).hasSize(1);
            assertThat(parameter(mine, "status").at("/schema/enum")).containsExactly(text("ONGOING"), text("ENDED"));
            assertThat(parameter(mine, "status").at("/schema/default").asText()).isEqualTo("ONGOING");
            assertThat(mine.at("/responses/200/content/application~1json/schema/items/$ref").asText()).isEqualTo("#/components/schemas/MyAttendance");
            assertThat(schemas.at("/MyAttendance/properties/checkedInAt/nullable").asBoolean()).isTrue();

            var qr = paths.path("/admin/attendances/{attendanceId}/qr").path("post");
            assertThat(qr.path("description").asText()).contains("30초", "재발급", "로그인 JWT");
            assertThat(qr.at("/responses/200/headers/Cache-Control/schema/enum")).containsExactly(text("no-store"));
            var checkIn = paths.path("/attendances/{attendanceId}/check-in").path("post");
            assertThat(checkIn.path("parameters")).hasSize(1);
            assertThat(checkIn.path("description").asText()).contains("동시 요청", "기존 출석 시각", "비고를 변경하지");
            assertThat(checkIn.at("/requestBody/content/application~1json/schema/$ref").asText()).isEqualTo("#/components/schemas/AttendanceCheckInRequest");
            assertThat(checkIn.at("/responses/200/content/application~1json/schema/$ref").asText()).isEqualTo("#/components/schemas/AttendanceCheckInResponse");
            assertThat(checkIn.at("/responses/409").isMissingNode()).isFalse();
            assertThat(schemas.at("/AttendanceCheckInRequest/properties/qrToken/maxLength").asInt()).isEqualTo(512);
            assertThat(schemas.at("/AttendanceCheckInResponse/properties/status/enum")).containsExactly(text("PRESENT"));
            assertThat(schemas.at("/ErrorResponse/required"))
                .containsExactlyInAnyOrder(text("timestamp"), text("status"), text("code"), text("message"), text("path"));
        });
    }

    private static JsonNode resolve(JsonNode document, JsonNode schema) {
        return schema.has("$ref") ? document.at(schema.path("$ref").asText().substring(1)) : schema;
    }

    private static JsonNode parameter(JsonNode operation, String name) {
        for (JsonNode parameter : operation.path("parameters")) {
            if (parameter.path("name").asText().equals(name)) return parameter;
        }
        throw new AssertionError("Missing parameter: " + name);
    }

    private static JsonNode text(String value) {
        return com.fasterxml.jackson.databind.node.TextNode.valueOf(value);
    }
}
