package wap.web2.server.member.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import wap.web2.server.admin.controller.AdminUserController;
import wap.web2.server.admin.dto.response.UserRolePageResponse;
import wap.web2.server.admin.dto.response.UserRoleResponse;
import wap.web2.server.admin.service.UserDeletionService;
import wap.web2.server.admin.service.UserRoleService;
import wap.web2.server.exception.GlobalExceptionHandler;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.member.dto.UserResponse;
import wap.web2.server.member.entity.MemberType;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.service.UserService;

class AccountApiContractTest {
    private final UserService users = mock(UserService.class);
    private final UserRoleService roles = mock(UserRoleService.class);
    private final UserDeletionService deletion = mock(UserDeletionService.class);
    private final UserPrincipal principal = new UserPrincipal(1L, "admin@example.invalid", null,
        List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        mvc = MockMvcBuilders.standaloneSetup(new UserController(users), new AdminUserController(roles, deletion))
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @AfterEach
    void clearPrincipal() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void registrationAndProfileEditingUseTheirSeparatePostAndPatchRoutes() throws Exception {
        UserResponse profile = UserResponse.builder().userName("홍길동").studentId("26")
            .wapMember(true).registrationRequired(false).build();
        when(users.completeRegistration(eq(principal), any())).thenReturn(profile);
        when(users.updateRegistration(eq(principal), any())).thenReturn(profile);
        String body = "{\"wapMember\":true,\"name\":\"홍길동\",\"studentId\":\"26\"}";
        mvc.perform(post("/user/registration").contentType("application/json").content(body))
            .andExpect(status().isOk()).andExpect(jsonPath("$.registrationRequired").value(false))
            .andExpect(jsonPath("$.studentId").value("26"));
        mvc.perform(patch("/user/registration").contentType("application/json").content(body))
            .andExpect(status().isOk()).andExpect(jsonPath("$.userName").value("홍길동"));
        verify(users).completeRegistration(eq(principal), any());
        verify(users).updateRegistration(eq(principal), any());
    }

    @Test
    void missingMembershipChoiceIsAClientError() throws Exception {
        mvc.perform(post("/user/registration").contentType("application/json").content("{}"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(users);
    }

    @Test
    void combinedRoleAndLevelFiltersReachTheServerBeforePagination() throws Exception {
        when(roles.getUsersForAdmin(12, 1, Role.ROLE_MEMBER, MemberType.NEW))
            .thenReturn(new UserRolePageResponse(List.of(), false));
        mvc.perform(get("/admin/role").param("page", "1").param("size", "12")
            .param("role", "ROLE_MEMBER").param("memberType", "NEW").param("membershipLevel", "NEW"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.hasNext").value(false));
        verify(roles).getUsersForAdmin(12, 1, Role.ROLE_MEMBER, MemberType.NEW);
    }

    @Test
    void combinedSaveReturnsTheValuesExpectedByTheScreen() throws Exception {
        when(roles.changeAttributes(any())).thenReturn(List.of(
            new UserRoleResponse(2L, "홍길동", "user@example.invalid", Role.ROLE_MEMBER, MemberType.REGULAR)));
        mvc.perform(patch("/admin/role/attributes").contentType("application/json")
            .content("{\"userIds\":[2],\"role\":\"ROLE_MEMBER\",\"memberType\":\"REGULAR\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].memberType").value("REGULAR"))
            .andExpect(jsonPath("$[0].role").value("ROLE_MEMBER"));
    }

    @Test
    void deletionUsesTheJsonBodyAndLoggedInActor() throws Exception {
        mvc.perform(delete("/admin/role/users").contentType("application/json")
            .content("{\"userIds\":[2]}"))
            .andExpect(status().isNoContent());
        verify(deletion).deleteUsers(List.of(2L), 1L);
    }
}
