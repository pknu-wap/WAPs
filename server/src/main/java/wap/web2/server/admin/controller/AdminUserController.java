package wap.web2.server.admin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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

@RestController
@RequestMapping("/admin/role")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRoleService userRoleService;

    @PatchMapping("/user")
    public ResponseEntity<?> changeUserRole(@RequestBody RoleChangeRequest roleChangeRequest) {
        RoleChangeResponse response = userRoleService.change(roleChangeRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<?> getAllUserInfos(@RequestParam("size") Integer size,
                                             @RequestParam("page") Integer page,
                                             @RequestParam(value = "role", required = false) Role role) {
        UserRolePageResponse response = userRoleService.getUsersForAdmin(size, page, role);
        return ResponseEntity.ok(response);
    }

}
