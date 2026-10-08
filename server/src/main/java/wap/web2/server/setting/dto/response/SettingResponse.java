package wap.web2.server.setting.dto.response;

import wap.web2.server.member.entity.User;

public record SettingResponse(String name, String memberType) {

    public static SettingResponse from(User user) {
        return new SettingResponse(user.getName(), null);
    }
}
