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

    @Schema(description = "입학 연도 뒤 두 자리. 미수집 시 null", example = "26", nullable = true)
    private String studentNumber;
    @Schema(description = "본인이 입력한 WAP 회원 여부. 과거 미수집 계정은 null일 수 있습니다.", nullable = true)
    private Boolean wapMember;
    @Schema(description = "현재 회원 구분. membershipLevel과 동일하며 NONE이면 null", nullable = true)
    private MemberType memberType;
    @Schema(description = "가입 완료 여부. false이면 회원가입 창을 표시합니다. 기존 계정은 true입니다.", example = "true")
    private boolean signupCompleted;

    @Schema(description = "현재 계정의 카카오 회원가입 정보 수정 가능 여부")
    private boolean registrationEditable;

    public static UserResponse of(User user) {
        return UserResponse.builder()
            .membershipLevel(user.getMembershipLevel())
            .userId(user.getId())
            .userName(user.getName())
            .userEmail(user.getEmail())
            .studentNumber(user.getStudentNumber())
            .wapMember(user.getWapMember() != null ? user.getWapMember()
                : user.getStudentNumber() != null || user.getMembershipLevel() != MembershipLevel.NONE ? true : null)
            .memberType(user.getMembershipLevel() == MembershipLevel.NONE
                ? null : MemberType.valueOf(user.getMembershipLevel().name()))
            .signupCompleted(user.isSignupCompleted())
            .registrationEditable(user.canEditRegistration())
            .build();
    }

}
