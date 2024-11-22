package wap.web2.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import wap.web2.server.domain.User;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.payload.response.UserResponse;
import wap.web2.server.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    //유저 정보 조회
    public UserResponse getUserDetail(UserPrincipal userPrincipal) {
        User user = userRepository.findById(userPrincipal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

        return UserResponse.of(user);
    }
}

