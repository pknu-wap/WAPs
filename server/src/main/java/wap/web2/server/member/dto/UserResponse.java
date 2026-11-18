package wap.web2.server.member.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.member.entity.User;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long userId;
    private String userName;
    private String userEmail;
    private String memberType;
    private boolean registrationRequired;
    private Boolean wapMember;
    private String studentId;

    public static UserResponse of(User user) {
        return UserResponse.builder()
            .userId(user.getId())
            .userName(user.getName())
            .userEmail(user.getEmail())
            .memberType(user.getMemberType() == null ? "미정" : user.getMemberType().getLabel())
            .registrationRequired(user.isRegistrationRequired())
            .wapMember(user.getWapMember())
            .studentId(user.getStudentId())
            .build();
    }
}
