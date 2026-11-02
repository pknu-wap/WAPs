package wap.web2.server.member.controller;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestBody;
import wap.web2.server.member.dto.MemberSignupRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.global.security.CurrentUser;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.member.dto.UserResponse;
import wap.web2.server.member.dto.UserRoleResponse;
import wap.web2.server.member.dto.UserVoteResponse;
import wap.web2.server.member.service.UserService;
import wap.web2.server.util.Semester;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> findUserDetail(@CurrentUser UserPrincipal userPrincipal) {
        UserResponse response = userService.getUserDetail(userPrincipal);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vote/{semester}")
    public ResponseEntity<UserVoteResponse> getMyVotedInfo(
        @CurrentUser UserPrincipal userPrincipal,
        @PathVariable("semester") @Semester String semester
    ) {
        UserVoteResponse response = userService.getUserVotedInfo(userPrincipal, semester);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signup")
    public ResponseEntity<UserResponse> signup(
        @CurrentUser UserPrincipal userPrincipal,
        @Valid @RequestBody MemberSignupRequest request
    ) {
        return ResponseEntity.ok(userService.signup(userPrincipal.getId(), request));
    }

    @PostMapping("/role/{role}")
    @Operation(deprecated = true, summary = "사용 중단된 역할 선택 API",
        description = "권한을 변경하지 않고 400을 반환합니다. POST /user/signup을 사용하세요.")
    public ResponseEntity<Void> setMyRole() {
        throw new wap.web2.server.exception.BadRequestException("POST /user/signup으로 회원가입해 주세요.");
    }

    @GetMapping("/role")
    @Operation(
        summary = "사용자 권한 확인",
        description = "사용자가 권한을 설정했는지, 어떤 권한을 가지고 있는지 확인합니다."
    )
    public ResponseEntity<UserRoleResponse> getMyRole(@CurrentUser UserPrincipal userPrincipal) {
        UserRoleResponse response = userService.getMyRole(userPrincipal.getId());
        return ResponseEntity.ok(response);
    }
}
