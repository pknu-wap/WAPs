package wap.web2.server.member.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.exception.ConflictException;
import wap.web2.server.exception.ForbiddenException;
import wap.web2.server.member.dto.MemberSignupRequest;
import wap.web2.server.member.entity.AuthProvider;
import wap.web2.server.member.entity.MembershipLevel;
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
        List<Long> projectIds = ballotRepository.findProjectIdsByUserIdAndSemester(
            user.getId(),
            semester
        );
        return new UserVoteResponse(projectIds);
    }

    @Transactional
    public UserResponse signup(Long userId, MemberSignupRequest request) {
        User user = userRepository.findByIdForUpdate(userId)
            .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        if (user.isSignupCompleted()) {
            throw new ConflictException("이미 회원가입을 완료한 계정입니다.");
        }
        if (user.getProvider() != AuthProvider.kakao || user.getRole() != Role.ROLE_GUEST) {
            throw new ForbiddenException("신규 카카오 계정만 회원가입할 수 있습니다.");
        }
        if (request.member() == null) {
            throw new BadRequestException("회원 여부를 선택해 주세요.");
        }
        if (request.member()) {
            if (request.name() == null || request.name().isBlank()
                || request.studentNumber() == null || request.memberType() == null) {
                throw new BadRequestException("회원은 이름, 학번, 회원 구분을 모두 입력해야 합니다.");
            }
            user.setName(request.name().strip());
            user.setStudentNumber(request.studentNumber());
            user.setMembershipLevel(MembershipLevel.valueOf(request.memberType().name()));
            user.setRole(Role.ROLE_MEMBER);
        } else if (request.name() != null || request.studentNumber() != null || request.memberType() != null) {
            throw new BadRequestException("비회원은 회원 여부만 입력해 주세요.");
        }
        user.setSignupCompleted(true);
        return UserResponse.of(user);
    }

    public UserRoleResponse getMyRole(Long id) {
        User user = findUser(id);
        Role role = user.getRole();
        boolean isAssigned = user.isSignupCompleted() && role != null;
        return new UserRoleResponse(role, user.getMembershipLevel(), isAssigned);
    }

    private User findUser(Long userId) {
        return userRepository
            .findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
    }
}
