package wap.web2.server.member;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import wap.web2.server.config.SwaggerConfig;
import wap.web2.server.exception.GlobalExceptionHandler;
import wap.web2.server.global.security.CustomUserDetailsService;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.global.security.config.SecurityConfig;
import wap.web2.server.global.security.handler.*;
import wap.web2.server.global.security.jwt.TokenProvider;
import wap.web2.server.global.security.oauth2.CustomOAuth2UserService;
import wap.web2.server.global.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;
import wap.web2.server.member.controller.UserController;
import wap.web2.server.member.service.UserService;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.member.entity.*;
import wap.web2.server.vote.repository.BallotRepository;

class MemberSignupControllerTest {
    private final UserRepository repository = mock(UserRepository.class);
    private final UserService service = new UserService(mock(BallotRepository.class), repository);
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
        .withBean(UserService.class, () -> service)
        .withBean(CustomUserDetailsService.class, () -> mock(CustomUserDetailsService.class))
        .withBean(CustomOAuth2UserService.class, () -> mock(CustomOAuth2UserService.class))
        .withBean(OAuth2AuthenticationSuccessHandler.class, () -> mock(OAuth2AuthenticationSuccessHandler.class))
        .withBean(OAuth2AuthenticationFailureHandler.class, () -> mock(OAuth2AuthenticationFailureHandler.class))
        .withBean(HttpCookieOAuth2AuthorizationRequestRepository.class, () -> mock(HttpCookieOAuth2AuthorizationRequestRepository.class))
        .withBean(TokenProvider.class, () -> mock(TokenProvider.class));

    @TestConfiguration(proxyBeanMethods = false)
    @EnableAutoConfiguration(exclude = {DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class, FlywayAutoConfiguration.class})
    @Import({SecurityConfig.class, SwaggerConfig.class, UserController.class, GlobalExceptionHandler.class,
        RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class, SecurityErrorResponseWriter.class})
    static class TestApplication {}


    @Test
    void signupRequiresAuthenticationAndRejectsInvalidBodies() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            mvc.perform(post("/user/signup").contentType("application/json").content("{\"member\":false}"))
                .andExpect(status().isUnauthorized());
            for (String body : List.of("{}", "null", "{\"member\":null}",
                "{\"member\":true,\"memberType\":\"ADMIN\"}",
                "{\"member\":true,\"studentNumber\":\"abc\"}",
                "{\"member\":true,\"studentNumber\":\"123456789012345678901\"}",
                "{\"member\":true,\"name\":\"" + "가".repeat(256) + "\"}")) {
                mvc.perform(post("/user/signup").with(user(principal()))
                    .contentType("application/json").content(body)).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("COMMON_INVALID_INPUT"));
            }
            verifyNoInteractions(repository);
        });
    }

    @Test
    void completesSignupOnceAndDisablesOldRoleMutationEndpoint() {
        context.run(ctx -> {
            var account = new User();
            account.setId(1L);
            account.setName("카카오 이름");
            account.setProvider(AuthProvider.kakao);
            account.setRole(Role.ROLE_GUEST);
            account.setSignupCompleted(false);
            when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(account));
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            mvc.perform(post("/user/signup").with(user(principal())).contentType("application/json")
                .content("{\"member\":true,\"name\":\"홍길동\",\"studentNumber\":\"20260001\",\"memberType\":\"NEW\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.signupCompleted").value(true))
                .andExpect(jsonPath("$.studentNumber").value("20260001"))
                .andExpect(jsonPath("$.membershipLevel").value("NEW"))
                .andExpect(jsonPath("$.memberType").value("NEW"));
            mvc.perform(post("/user/signup").with(user(principal())).contentType("application/json")
                .content("{\"member\":false}")).andExpect(status().isConflict());
            mvc.perform(post("/user/role/ROLE_ADMIN").with(user(principal())))
                .andExpect(status().isForbidden());
            assertThat(account.getRole()).isEqualTo(Role.ROLE_MEMBER);
        });
    }

    @Test
    void openApiDocumentsSignupFlowConditionalFieldsExamplesAndErrors() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            String json = mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
            var document = ctx.getBean(com.fasterxml.jackson.databind.ObjectMapper.class).readTree(json);
            var operation = document.at("/paths/~1user~1signup/post");
            assertThat(operation.path("description").asText())
                .contains("signupCompleted=false", "ROLE_GUEST", "ROLE_MEMBER", "409", "/auth/signup");
            assertThat(operation.at("/security/0/JWT").isArray()).isTrue();
            assertThat(operation.path("parameters").isMissingNode()).isTrue();
            assertThat(operation.at("/requestBody/required").asBoolean()).isTrue();
            var request = operation.at("/requestBody/content/application~1json");
            assertThat(request.at("/schema/$ref").asText()).isEqualTo("#/components/schemas/MemberSignupRequest");
            assertThat(request.path("examples").size()).isEqualTo(4);
            assertThat(request.at("/examples/비회원/value/member").asBoolean()).isFalse();
            for (String code : List.of("200", "400", "401", "403", "404", "409")) {
                assertThat(operation.at("/responses/" + code).isMissingNode()).isFalse();
                String schema = code.equals("200") ? "UserResponse" : "ErrorResponse";
                assertThat(operation.at("/responses/" + code + "/content/application~1json/schema/$ref").asText())
                    .isEqualTo("#/components/schemas/" + schema);
            }
            var schema = document.at("/components/schemas/MemberSignupRequest");
            assertThat(schema.path("required")).containsExactly(com.fasterxml.jackson.databind.node.TextNode.valueOf("member"));
            assertThat(schema.at("/properties/studentNumber/pattern").asText()).isEqualTo("[0-9]{1,20}");
            assertThat(schema.at("/properties/memberType/enum")).containsExactly(
                com.fasterxml.jackson.databind.node.TextNode.valueOf("NEW"),
                com.fasterxml.jackson.databind.node.TextNode.valueOf("ASSOCIATE"),
                com.fasterxml.jackson.databind.node.TextNode.valueOf("REGULAR"));
            assertThat(document.at("/components/schemas/UserResponse/properties/signupCompleted/type").asText()).isEqualTo("boolean");
            assertThat(document.at("/paths/~1user~1role~1{role}/post").isMissingNode()).isTrue();
        });
    }

    private UserPrincipal principal() {
        return new UserPrincipal(1L, "test@example.com", null,
            List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_GUEST")));
    }
}
