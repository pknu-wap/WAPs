package wap.web2.server.member.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import wap.web2.server.member.entity.MemberType;

@Schema(description = "카카오 로그인 후 최초 가입 요청. member=true이면 name, studentNumber, memberType이 모두 필수입니다. "
    + "member=false이면 추가 필드를 보내지 마세요. 사용자 ID와 권한은 서버가 결정합니다.")
public record MemberSignupRequest(
    @Schema(description = "WAP 회원 여부. true: ROLE_MEMBER, false: ROLE_GUEST", example = "true", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "회원 여부를 선택해 주세요.") Boolean member,
    @Schema(description = "회원 실명. 회원 선택 시 필수이며 공백만 입력할 수 없습니다. 앞뒤 공백은 제거됩니다.", example = "홍길동", maxLength = 255)
    @Size(max = 255, message = "이름은 255자 이하여야 합니다.") String name,
    @Schema(description = "회원 학번. 회원 선택 시 필수. 선행 0을 보존하는 숫자 문자열이며 중복을 제한하지 않습니다.", example = "202600001", pattern = "[0-9]{1,20}", minLength = 1, maxLength = 20)
    @Pattern(regexp = "[0-9]{1,20}", message = "학번은 1~20자리 숫자여야 합니다.") String studentNumber,
    @Schema(description = "회원 구분. 회원 선택 시 필수. NEW: 신입회원, ASSOCIATE: 준회원, REGULAR: 정회원", example = "NEW")
    MemberType memberType
) {}
