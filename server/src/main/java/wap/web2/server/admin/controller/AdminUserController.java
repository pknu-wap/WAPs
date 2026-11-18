package wap.web2.server.admin.controller;

import jakarta.validation.Valid;
import java.util.List;
import wap.web2.server.admin.dto.request.MemberTypeChangeRequest;
import wap.web2.server.admin.dto.request.UserAttributesChangeRequest;
import wap.web2.server.admin.dto.response.UserRoleResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import wap.web2.server.admin.dto.request.UserDeleteRequest;
import wap.web2.server.admin.service.UserDeletionService;
import wap.web2.server.global.security.CurrentUser;
import wap.web2.server.global.security.UserPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.admin.dto.request.RoleChangeRequest;
import wap.web2.server.admin.dto.response.RoleChangeResponse;
import wap.web2.server.admin.dto.response.UserRolePageResponse;
import wap.web2.server.admin.service.UserRoleService;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.MemberType;

@RestController
@RequestMapping("/admin/role")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRoleService userRoleService;
    private final UserDeletionService userDeletionService;

    @DeleteMapping("/users")
    public ResponseEntity<Void> deleteUsers(
        @CurrentUser UserPrincipal principal,
        @Valid @RequestBody UserDeleteRequest request
    ) {
        userDeletionService.deleteUsers(request.userIds(), principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/attributes")
    public ResponseEntity<List<UserRoleResponse>> changeUserAttributes(
        @Valid @RequestBody UserAttributesChangeRequest request
    ) {
        return ResponseEntity.ok(userRoleService.changeAttributes(request));
    }

    @PatchMapping("/member-type")
    public ResponseEntity<List<UserRoleResponse>> changeMemberType(
        @Valid @RequestBody MemberTypeChangeRequest request
    ) {
        return ResponseEntity.ok(userRoleService.changeMemberType(request));
    }

    @PatchMapping("/user")
    public ResponseEntity<RoleChangeResponse> changeUserRole(
        @RequestBody RoleChangeRequest roleChangeRequest
    ) {
        RoleChangeResponse response = userRoleService.change(roleChangeRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<UserRolePageResponse> getAllUserInfos(
        @RequestParam("size") Integer size,
        @RequestParam("page") Integer page,
        @RequestParam(value = "role", required = false) Role role,
        @RequestParam(value = "memberType", required = false) MemberType memberType
    ) {
        UserRolePageResponse response = userRoleService.getUsersForAdmin(size, page, role, memberType);
        return ResponseEntity.ok(response);
    }
}
