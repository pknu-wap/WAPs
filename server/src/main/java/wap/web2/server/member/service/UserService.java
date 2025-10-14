package wap.web2.server.member.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.member.dto.UserResponse;
import wap.web2.server.member.dto.UserVoteResponse;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.security.core.UserPrincipal;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    // 유저 정보 조회
    public UserResponse getUserDetail(UserPrincipal userPrincipal) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

        return UserResponse.of(user);
    }

    // 유저가 투표한 프로젝트 id 3개 반환
    public UserVoteResponse getUserVotedInfo(UserPrincipal userPrincipal) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));

        return new UserVoteResponse(user.getVotedProjectIds());
    }

    public void setRole(UserPrincipal userPrincipal, String role) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));

        user.setRole(Role.from(role));
        userRepository.save(user);
    }

}

