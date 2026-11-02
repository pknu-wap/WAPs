package wap.web2.server.member.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import wap.web2.server.member.entity.MemberType;

public record MemberSignupRequest(
    @NotNull(message = "회원 여부를 선택해 주세요.") Boolean member,
    @Size(max = 255, message = "이름은 255자 이하여야 합니다.") String name,
    @Pattern(regexp = "[0-9]{1,20}", message = "학번은 1~20자리 숫자여야 합니다.") String studentNumber,
    MemberType memberType
) {}
