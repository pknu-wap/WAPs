package wap.web2.server.member.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.exception.ForbiddenException;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.member.dto.UserRegistrationRequest;
import wap.web2.server.member.dto.UserResponse;
import wap.web2.server.member.dto.UserRoleResponse;
import wap.web2.server.member.dto.UserVoteResponse;
import wap.web2.server.member.entity.AuthProvider;
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

    @Transactional
    public UserResponse completeRegistration(UserPrincipal userPrincipal, UserRegistrationRequest request) {
        return saveRegistration(userPrincipal, request, false);
    }

    @Transactional
    public UserResponse updateRegistration(UserPrincipal userPrincipal, UserRegistrationRequest request) {
        return saveRegistration(userPrincipal, request, true);
    }

    private UserResponse saveRegistration(UserPrincipal userPrincipal, UserRegistrationRequest request, boolean editing) {
        if (request == null || request.wapMember() == null) {
            throw new BadRequestException("회원 여부를 선택해주세요.");
        }
        User user = userRepository.findByIdForUpdate(userPrincipal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        if (user.getProvider() != AuthProvider.kakao) {
            throw new ForbiddenException("카카오 계정만 가입 정보를 등록할 수 있습니다.");
        }
        if (!editing && !user.isRegistrationRequired()) {
            return UserResponse.of(user);
        }

        if (request.wapMember()) {
            String name = request.name() == null ? "" : request.name().strip();
            if (name.isEmpty() || name.length() > 4) {
                throw new BadRequestException("이름은 1자 이상 4자 이하로 입력해주세요.");
            }
            if (request.studentId() == null || !request.studentId().matches("[0-9]{2}")) {
                throw new BadRequestException("학번은 숫자 2자리로 입력해주세요.");
            }
            user.setName(name);
            user.setStudentId(request.studentId());
        }
        if (!request.wapMember()) user.setStudentId(null);
        user.setWapMember(request.wapMember());
        user.setRegistrationRequired(false);
        return UserResponse.of(user);
    }

    public UserVoteResponse getUserVotedInfo(UserPrincipal userPrincipal, String semester) {
        User user = findUser(userPrincipal.getId());
        List<Long> projectIds = ballotRepository.findProjectIdsByUserIdAndSemester(
            user.getId(),
            semester
        );
        return new UserVoteResponse(projectIds);
    }

    public void setRole(UserPrincipal userPrincipal, String role) {
        User user = findUser(userPrincipal.getId());
        if (Role.from(role) != user.getRole()) {
            throw new ForbiddenException("사용자 권한은 관리자만 변경할 수 있습니다.");
        }
    }

    public UserRoleResponse getMyRole(Long id) {
        User user = findUser(id);
        Role role = user.getRole();
        boolean isAssigned = role != null;
        return new UserRoleResponse(role, isAssigned);
    }

    private User findUser(Long userId) {
        return userRepository
            .findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
    }
}
