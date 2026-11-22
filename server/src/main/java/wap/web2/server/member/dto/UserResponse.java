package wap.web2.server.member.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.member.entity.MembershipLevel;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.entity.MemberType;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    @Schema(description = "현재 회원 단계. 관리자 및 출석 API와 동일한 값")
    private MembershipLevel membershipLevel;
    @Schema(description = "로그인 계정 ID", example = "1")
    private Long userId;
    @Schema(description = "회원 실명 또는 비회원의 카카오 프로필 이름", example = "홍길동")
    private String userName;
    @Schema(description = "로그인 계정 이메일", example = "user@example.com")
    private String userEmail;

    @Schema(description = "입학 연도 뒤 두 자리. 미수집 또는 해석할 수 없는 기존 학번은 null", example = "26", nullable = true)
    private String studentNumber;
    @Schema(description = "현재 회원 구분. membershipLevel과 동일하며 NONE이면 null", nullable = true)
    private MemberType memberType;
    @Schema(description = "가입 완료 여부. false이면 회원가입 창을 표시합니다. 기존 계정은 true입니다.", example = "true")
    private boolean signupCompleted;

    public static UserResponse of(User user) {
        return UserResponse.builder()
            .membershipLevel(user.getMembershipLevel())
            .userId(user.getId())
            .userName(user.getName())
            .userEmail(user.getEmail())
            .studentNumber(studentYear(user.getStudentNumber()))
            .memberType(user.getMembershipLevel() == MembershipLevel.NONE
                ? null : MemberType.valueOf(user.getMembershipLevel().name()))
            .signupCompleted(user.isSignupCompleted())
            .build();
    }

    private static String studentYear(String value) {
        if (value == null) return null;
        if (value.matches("[0-9]{2}")) return value;
        // Older records may contain the full admission year or nine-digit student number.
        if (value.matches("(?:19|20)[0-9]{2}(?:[0-9]{5})?")) return value.substring(2, 4);
        return null;
    }
}
