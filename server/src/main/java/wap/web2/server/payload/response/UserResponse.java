package wap.web2.server.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.domain.User;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long userId;
    private String userName;
    private String userEmail;



    public static UserResponse of(User user) {
        return UserResponse.builder()
                .userId(user.getId())
                .userName(user.getName())
                .userEmail(user.getEmail())
                .build();
    }

}