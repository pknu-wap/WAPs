package wap.web2.server.teambuild.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.service.ProjectService;
import wap.web2.server.teambuild.dto.response.RoleResponse;

@RestController
@RequestMapping("/team-build")
@RequiredArgsConstructor
public class TeamBuildControllerV3 {

    private final ProjectService projectService;

    // 팀 빌딩 시 사용되는 "내 역할(팀장 or 팀원)" 반환
    @GetMapping("/role")
    public ResponseEntity<?> getMyRole(@CurrentUser UserPrincipal userPrincipal) {
        try {
            boolean isLeader = projectService.isLeader(userPrincipal.getId());
            return ResponseEntity.ok(new RoleResponse(isLeader ? "leader" : "member"));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("[ERROR] 잘못된 유저입니다.");
        }
    }

}
