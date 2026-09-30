package wap.web2.server.setting.dto.response;

import wap.web2.server.member.entity.User;

public record SettingUpdateResponse(String name) {

    public static SettingUpdateResponse from(User user) {
        return new SettingUpdateResponse(user.getName());
    }
}
