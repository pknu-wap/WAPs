package wap.web2.server.member.controller;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.member.dto.UserResponse;
import wap.web2.server.member.dto.UserRoleResponse;
import wap.web2.server.member.dto.UserVoteResponse;
import wap.web2.server.member.service.UserService;
import wap.web2.server.security.core.CurrentUser;
import wap.web2.server.security.core.UserPrincipal;
import wap.web2.server.util.Semester;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 자신의 회원 정보를 리턴
    @GetMapping("/me") // @CurrentUser : 프론트에서 주는 토큰을 가지고 객체를 만들어줌
    public ResponseEntity<?> findUserDetail(@CurrentUser UserPrincipal userPrincipal) {
        UserResponse response = userService.getUserDetail(userPrincipal);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/vote/{semester}")
    public ResponseEntity<?> getMyVotedInfo(@CurrentUser UserPrincipal userPrincipal,
                                            @PathVariable("semester") @Semester String semester) {
        UserVoteResponse response = userService.getUserVotedInfo(userPrincipal, semester);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // 회원 구분 선택
    @PostMapping("/role/{role}")
    public ResponseEntity<?> setMyRole(@CurrentUser UserPrincipal userPrincipal,
                                       @PathVariable("role") String role) {
        try {
            userService.setRole(userPrincipal, role);
            return ResponseEntity.ok("회원 등록에 성공했습니다!");
        } catch (Exception e) {
            return ResponseEntity.status(401).body("회원 등록에 실패했습니다!");
        }
    }

    @GetMapping("/role")
    @Operation(summary = "사용자 권한 확인", description = "사용자가 권한을 설정했는지, 어떤 권한을 가지는지 확인합니다.")
    public ResponseEntity<?> getMyRole(@CurrentUser UserPrincipal userPrincipal) {
        UserRoleResponse response = userService.getMyRole(userPrincipal.getId());
        return ResponseEntity.ok(response);
    }

}
