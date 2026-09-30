package wap.web2.server.setting.controller;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.global.security.CurrentUser;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.setting.dto.request.SettingUpdateRequest;
import wap.web2.server.setting.dto.response.SettingUpdateResponse;
import wap.web2.server.setting.service.SettingService;

@RestController
@RequestMapping("/user/settings")
@RequiredArgsConstructor
public class SettingController {

    private final SettingService settingService;

    @PostMapping
    @Operation(summary = "유저 환경설정 변경", description = "로그인한 유저의 이름을 변경합니다.")
    public ResponseEntity<SettingUpdateResponse> updateSetting(
        @CurrentUser UserPrincipal userPrincipal,
        @RequestBody @Valid SettingUpdateRequest request
    ) {
        return ResponseEntity.ok(settingService.updateSetting(userPrincipal, request));
    }
}
