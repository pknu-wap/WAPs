package wap.web2.server.setting.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import wap.web2.server.member.entity.User;

public record SettingResponse(
    @Schema(description = "이름", example = "김개발") String name,
    @Schema(description = "회원 구분", nullable = true, example = "정회원") String memberType
) {

    public static SettingResponse from(User user) {
        return new SettingResponse(user.getName(), null);
    }
}
