package wap.web2.server.admin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.admin.dto.RoleChangeResponse;
import wap.web2.server.admin.dto.UserRoleRequest;
import wap.web2.server.admin.service.UserRoleService;

@RestController
@RequestMapping("/admin/role")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRoleService userRoleService;

    @PatchMapping("/user")
    public ResponseEntity<?> changeUserRole(@RequestBody UserRoleRequest userRoleRequest) {
        RoleChangeResponse response = userRoleService.change(userRoleRequest);
        return ResponseEntity.ok(response);
    }

    // 사용자 정보 확인 기능
}
