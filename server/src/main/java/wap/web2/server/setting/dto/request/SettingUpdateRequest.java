package wap.web2.server.setting.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SettingUpdateRequest(
    @Schema(description = "앞뒤 공백을 제거한 이름. 한글 1~10자 또는 영문 1~15자(단어 사이 공백 1칸 허용)", example = "김개발")
    @NotBlank(message = "이름을 입력해 주세요.")
    @Pattern(
        regexp = "^([가-힣]{1,10}|(?=.{1,15}$)[A-Za-z]+( [A-Za-z]+)*)$",
        message = "이름은 한글 10자 또는 영문 15자 이내로 입력해 주세요."
    )
    String name
) {

    public SettingUpdateRequest {
        if (name != null) {
            name = name.strip();
        }
    }
}
