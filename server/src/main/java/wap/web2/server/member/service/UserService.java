package wap.web2.server.member.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import wap.web2.server.member.entity.User;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.member.dto.UserResponse;
import wap.web2.server.member.repository.UserRepository;

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

