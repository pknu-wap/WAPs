package wap.web2.server.config;

import static org.mockito.Mockito.mock;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import wap.web2.server.admin.controller.AdminUserController;
import wap.web2.server.admin.service.UserRoleService;
import wap.web2.server.admin.controller.AdminVoteController;
import wap.web2.server.admin.service.AdminVoteService;
import wap.web2.server.vote.controller.VoteController;
import wap.web2.server.vote.service.VoteService;
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
    @Test
    void bulkManagementRequiresAdminAndValidInput() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            for (var request : java.util.List.of(
                patch("/admin/role/attributes").content("{\"userIds\":[1],\"role\":\"ROLE_ADMIN\"}"),
                delete("/admin/role/users").content("{\"userIds\":[1]}"))) {
                request.contentType("application/json");
                mvc.perform(request).andExpect(status().isUnauthorized());
                mvc.perform(request.with(user("member").roles("MEMBER"))).andExpect(status().isForbidden());
                mvc.perform(request.with(user("guest").roles("GUEST"))).andExpect(status().isForbidden());
                mvc.perform(request.with(user("admin").roles("ADMIN"))).andExpect(status().is2xxSuccessful());
            }
            for (String body : new String[]{"{}", "{\"userIds\":[1]}",
                "{\"userIds\":[],\"role\":\"ROLE_ADMIN\"}",
                "{\"userIds\":[null],\"memberType\":\"NEW\"}",
                "{\"userIds\":[-1],\"memberType\":\"NEW\"}",
                "{\"userIds\":[1],\"memberType\":\"UNKNOWN\"}"}) {
                mvc.perform(patch("/admin/role/attributes").with(user("admin").roles("ADMIN"))
                    .contentType("application/json").content(body)).andExpect(status().isBadRequest());
            }
            mvc.perform(delete("/admin/role/users").with(user("admin").roles("ADMIN"))
                .contentType("application/json").content("{\"userIds\":[]}"))
                .andExpect(status().isBadRequest());
        });
    }

    @Test
    void acceptsMemberTypeAliasAndRejectsConflictingFilters() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            mvc.perform(get("/admin/role").with(user("admin").roles("ADMIN"))
                .param("size", "12").param("page", "0").param("memberType", "UNDECIDED"))
                .andExpect(status().isOk());
            org.mockito.Mockito.verify(ctx.getBean(UserRoleService.class)).getUsersForAdmin(
                12, 0, null, wap.web2.server.member.entity.MembershipLevel.NONE, null);
            mvc.perform(get("/admin/role").with(user("admin").roles("ADMIN"))
                .param("size", "12").param("page", "0").param("memberType", "NEW")
                .param("membershipLevel", "REGULAR")).andExpect(status().isBadRequest());
        });
    }
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
        .withBean(AdminVoteService.class, () -> mock(AdminVoteService.class))
        .withBean(VoteService.class, () -> mock(VoteService.class))
        .withBean(wap.web2.server.admin.service.UserManagementService.class,
            () -> mock(wap.web2.server.admin.service.UserManagementService.class))
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
        SecurityConfig.class, Endpoints.class, AdminUserController.class, AdminVoteController.class, VoteController.class, GlobalExceptionHandler.class, RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class, SecurityErrorResponseWriter.class
    })
    static class TestApplication {}

    @Test
    void voteInputValidationRejectsInvalidSemestersAndParticipantLists() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            for (String path : new String[]{"/vote/result/invalid", "/vote/invalid/projects"}) {
                mvc.perform(get(path).with(user("member").roles("MEMBER"))).andExpect(status().isBadRequest());
            }
            for (String body : new String[]{"{}", "{\"projectIds\":[]}", "{\"projectIds\":[1,2]}",
                "{\"projectIds\":[1,2,null]}", "{\"projectIds\":[1,2,-3]}"}) {
                mvc.perform(post("/admin/vote/open").param("semester", "2026-02")
                    .with(user("admin").roles("ADMIN")).contentType("application/json").content(body))
                    .andExpect(status().isBadRequest());
            }
            org.mockito.Mockito.verifyNoInteractions(ctx.getBean(VoteService.class), ctx.getBean(AdminVoteService.class));
        });
    }

    @Test
    void deletingVotesRequiresAdminAndValidSemester() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            String path = "/admin/vote";
            mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(path).param("semester", "2026-02")).andExpect(status().isUnauthorized());
            for (String role : new String[]{"GUEST", "MEMBER"}) {
                mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(path).param("semester", "2026-02").with(user("user").roles(role)))
                    .andExpect(status().isForbidden());
            }
            mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(path).param("semester", "2026-02").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
            mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(path).param("semester", "invalid").with(user("admin").roles("ADMIN")))
                .andExpect(status().isBadRequest());
            mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(path).with(user("admin").roles("ADMIN")))
                .andExpect(status().isBadRequest());
            org.mockito.Mockito.verify(ctx.getBean(AdminVoteService.class)).deleteVote("2026-02");
            org.mockito.Mockito.verifyNoMoreInteractions(ctx.getBean(AdminVoteService.class));
        });
    }


    @RestController
    static class Endpoints {
        @RequestMapping({"/project", "/project/1", "/team-build/apply/submit",
            "/team-build/recruit/submit", "/comment/1", "/user/role/ROLE_ADMIN", "/user/role"})
        String endpoint() { return "ok"; }
    }

    @ParameterizedTest
    @ValueSource(strings = {"GUEST", "MEMBER", "ADMIN"})
    void enforcesRolePermissions(String role) {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            var identity = user("user").roles(role);
            // 실제 투표 컨트롤러: 인증된 역할은 접근 가능하며 잘못된 본문은 검증에서 거절한다.
            mvc.perform(post("/vote").with(identity).contentType("application/json").content("{}"))
                .andExpect(status().isBadRequest());
            mvc.perform(post("/vote")).andExpect(status().isUnauthorized());
            for (String path : new String[]{"/project/1", "/user/role"}) {
                mvc.perform(get(path).with(identity)).andExpect(status().isOk());
            }
            for (String path : new String[]{"/comment/1"}) {
                mvc.perform(post(path).with(identity)).andExpect(status().isOk());
                mvc.perform(post(path)).andExpect(status().isUnauthorized());
            }
            for (String path : new String[]{"/project", "/team-build/apply/submit", "/team-build/recruit/submit"}) {
                mvc.perform(post(path).with(identity))
                    .andExpect(role.equals("GUEST") ? status().isForbidden() : status().isOk());
                mvc.perform(post(path)).andExpect(status().isUnauthorized());
            }
            mvc.perform(put("/project/1").with(identity)).andExpect(status().isOk());
            mvc.perform(put("/project/1")).andExpect(status().isUnauthorized());
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

    @Test
    void acceptsCombinedRoleLevelAndNameFiltersAndRejectsUnknownLevels() {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
            mvc.perform(get("/admin/role").with(user("admin").roles("ADMIN"))
                .param("size", "12").param("page", "0")
                .param("role", "ROLE_MEMBER").param("membershipLevel", "NEW").param("name", "하늘"))
                .andExpect(status().isOk());
            org.mockito.Mockito.verify(ctx.getBean(UserRoleService.class)).getUsersForAdmin(
                12, 0, wap.web2.server.member.entity.Role.ROLE_MEMBER,
                wap.web2.server.member.entity.MembershipLevel.NEW, "하늘");
            mvc.perform(get("/admin/role").with(user("admin").roles("ADMIN"))
                .param("size", "12").param("page", "0").param("membershipLevel", "UNKNOWN"))
                .andExpect(status().isBadRequest());
        });
    }

}
