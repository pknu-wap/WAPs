package wap.web2.server.member.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import wap.web2.server.exception.ErrorResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import wap.web2.server.member.dto.MemberSignupRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
    @Operation(summary = "내 계정 및 가입 상태 조회",
        description = "카카오 로그인 후 signupCompleted=false이면 회원가입 창을 표시합니다. "
            + "가입 완료 및 기존 계정은 true입니다. 학번은 미수집 시 null이며 회원 구분은 현재 회원 단계를 반환합니다.")
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
    @Operation(
        summary = "카카오 신규 계정 회원가입 완료",
        description = """
            1. /oauth2/authorization/kakao로 로그인합니다. 서버는 처음 로그인한 계정을 가입 대기 상태로 저장합니다.
            2. 로그인 복귀 URL의 token과 signupCompleted를 확인합니다. signupCompleted=false이면 회원가입 창을 표시합니다.
               GET /user/me에서도 가입 상태를 확인할 수 있습니다. 기존 계정은 true로 유지합니다.
            3. 로그인으로 발급받은 JWT를 Authorization: Bearer <token>으로 전달하여 이 API를 호출합니다.
            - 비회원: {"member":false}만 전송합니다. 추가 정보 없이 ROLE_GUEST로 가입합니다.
            - 회원: member=true와 이름(name), 학번(studentNumber), 회원 구분(memberType)을 모두 전송합니다.
              memberType은 NEW(신입회원), ASSOCIATE(준회원), REGULAR(정회원) 중 하나이며 ROLE_MEMBER로 가입합니다.
              선택한 구분은 membershipLevel에 저장되어 관리자 및 출석 API에서도 동일하게 사용합니다.
            성공하면 signupCompleted=true를 반환합니다. 다음 로그인부터 회원가입 창을 표시하지 않습니다.
            가입 도중 이탈한 계정은 다음 로그인에서도 false를 반환하여 가입을 이어갑니다.
            중복·동시 제출은 한 번만 처리하며 이미 완료된 계정의 재요청은 409입니다.
            가입 정보와 권한은 이 API로 다시 변경할 수 없습니다. 회원 권한은 다음 API 요청부터 적용되므로 토큰 재발급은 필요 없습니다.
            이 API는 로그인한 카카오 계정의 가입을 완료합니다. 이메일/비밀번호 계정 생성 API인 /auth/signup과 별개입니다.
            """,
        security = @SecurityRequirement(name = "JWT"),
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = MemberSignupRequest.class),
                examples = {
                    @ExampleObject(name = "비회원", value = "{\"member\":false}"),
                    @ExampleObject(name = "신입회원", value = "{\"member\":true,\"name\":\"홍길동\",\"studentNumber\":\"202600001\",\"memberType\":\"NEW\"}"),
                    @ExampleObject(name = "준회원", value = "{\"member\":true,\"name\":\"홍길동\",\"studentNumber\":\"202500001\",\"memberType\":\"ASSOCIATE\"}"),
                    @ExampleObject(name = "정회원", value = "{\"member\":true,\"name\":\"홍길동\",\"studentNumber\":\"202400001\",\"memberType\":\"REGULAR\"}")
                })
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "가입 완료. signupCompleted=true",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserResponse.class))),
        @ApiResponse(responseCode = "400", description = "COMMON_INVALID_INPUT: 회원 여부 누락, 회원 필수 정보 누락, 형식 오류 또는 비회원 추가 정보 입력",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "401", description = "AUTH_UNAUTHORIZED / AUTH_TOKEN_EXPIRED / AUTH_INVALID_TOKEN: 로그인 토큰 누락·만료·유효하지 않은 토큰",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "403", description = "AUTH_FORBIDDEN: 가입 대기 중인 카카오 게스트 계정이 아님",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "404", description = "COMMON_RESOURCE_NOT_FOUND: 로그인한 사용자를 찾을 수 없음",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "409", description = "COMMON_CONFLICT: 이미 가입 완료한 계정(기존 계정 및 중복 제출 포함)",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<UserResponse> signup(
        @Parameter(hidden = true) @CurrentUser UserPrincipal userPrincipal,
        @Valid @RequestBody MemberSignupRequest request
    ) {
        return ResponseEntity.ok(userService.signup(userPrincipal.getId(), request));
    }

    @GetMapping("/role")
    @Operation(
        summary = "사용자 권한 확인",
        description = "사용자의 권한과 가입 완료 여부(isRoleAssigned)를 확인합니다. 가입 대기 계정은 false입니다."
    )
    public ResponseEntity<UserRoleResponse> getMyRole(@CurrentUser UserPrincipal userPrincipal) {
        UserRoleResponse response = userService.getMyRole(userPrincipal.getId());
        return ResponseEntity.ok(response);
    }
}
