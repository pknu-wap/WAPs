package wap.web2.server.setting.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.exception.ErrorResponse;
import wap.web2.server.global.security.CurrentUser;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.setting.dto.request.SettingUpdateRequest;
import wap.web2.server.setting.dto.response.SettingResponse;
import wap.web2.server.setting.dto.response.SettingUpdateResponse;
import wap.web2.server.setting.service.SettingService;

@RestController
@RequestMapping(value = "/api/member", produces = "application/json")
@RequiredArgsConstructor
@Tag(name = "설정", description = "설정 페이지의 이름·회원 구분 조회 및 이름 변경 (로그인 필요)")
@ApiResponses({
    @ApiResponse(responseCode = "401", description = "로그인 토큰 누락·오류·만료 (AUTH_UNAUTHORIZED / AUTH_INVALID_TOKEN / AUTH_TOKEN_EXPIRED)",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음 (COMMON_RESOURCE_NOT_FOUND)",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
})
public class SettingController {

    private final SettingService settingService;

    @GetMapping
    @Operation(operationId = "getSetting", summary = "유저 환경설정 조회", description = """
        로그인한 유저의 이름과 회원 구분을 조회합니다.
        사용자 ID는 JWT에서 확인하며 요청 파라미터로 받지 않습니다.
        회원 구분(memberType)은 회원 명단 연동 전까지 null입니다.
        """)
    @ApiResponse(responseCode = "200", description = "이름과 회원 구분")
    public ResponseEntity<SettingResponse> getSetting(
        @Parameter(hidden = true) @CurrentUser UserPrincipal userPrincipal
    ) {
        return ResponseEntity.ok(settingService.getSetting(userPrincipal));
    }

    @PatchMapping("/name")
    @Operation(operationId = "updateName", summary = "유저 이름 변경", description = """
        로그인한 유저의 이름을 변경합니다.
        사용자 ID는 JWT에서 확인하며 요청 파라미터로 받지 않습니다.
        앞뒤 공백을 제거한 뒤 한글(완성형)만 1~10자 또는 영문만 1~15자(단어 사이 공백 1칸 허용)인지 검사합니다.
        한영 혼용, 숫자, 특수문자, 자모만 입력, 연속 공백, 빈 값은 거부합니다.
        """)
    @ApiResponse(responseCode = "200", description = "변경된 이름")
    @ApiResponse(responseCode = "400", description = "이름 규칙 위반 (COMMON_INVALID_INPUT)",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<SettingUpdateResponse> updateSetting(
        @Parameter(hidden = true) @CurrentUser UserPrincipal userPrincipal,
        @RequestBody @Valid SettingUpdateRequest request
    ) {
        return ResponseEntity.ok(settingService.updateSetting(userPrincipal, request));
    }
}
