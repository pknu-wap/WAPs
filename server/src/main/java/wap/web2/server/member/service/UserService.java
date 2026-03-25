package wap.web2.server.member.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.member.dto.UserResponse;
import wap.web2.server.member.dto.UserRoleResponse;
import wap.web2.server.member.dto.UserVoteResponse;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.vote.repository.BallotRepository;

@Service
@RequiredArgsConstructor
public class UserService {

    private final BallotRepository ballotRepository;
    private final UserRepository userRepository;

    public UserResponse getUserDetail(UserPrincipal userPrincipal) {
        User user = findUser(userPrincipal.getId());
        return UserResponse.of(user);
    }

    public UserVoteResponse getUserVotedInfo(UserPrincipal userPrincipal, String semester) {
        User user = findUser(userPrincipal.getId());
        List<Long> projectIds = ballotRepository.findProjectIdsByUserIdAndSemester(user.getId(), semester);
        return new UserVoteResponse(projectIds);
    }

    public void setRole(UserPrincipal userPrincipal, String role) {
        User user = findUser(userPrincipal.getId());
        user.setRole(Role.from(role));
        userRepository.save(user);
    }

    public UserRoleResponse getMyRole(Long id) {
        User user = findUser(id);
        Role role = user.getRole();
        boolean isAssigned = role != null;
        return new UserRoleResponse(role, isAssigned);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
    }
}
