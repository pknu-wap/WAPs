package wap.web2.server.setting.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import wap.web2.server.member.entity.User;

public record SettingUpdateResponse(
    @Schema(description = "변경된 이름", example = "김개발") String name
) {

    public static SettingUpdateResponse from(User user) {
        return new SettingUpdateResponse(user.getName());
    }
}
