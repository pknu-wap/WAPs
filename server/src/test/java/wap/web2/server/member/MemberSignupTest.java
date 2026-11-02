package wap.web2.server.member;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.exception.ConflictException;
import wap.web2.server.exception.ForbiddenException;
import wap.web2.server.member.dto.MemberSignupRequest;
import wap.web2.server.member.entity.*;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.member.service.UserService;
import wap.web2.server.vote.repository.BallotRepository;

class MemberSignupTest {
    private final UserRepository repository = mock(UserRepository.class);
    private final UserService service = new UserService(mock(BallotRepository.class), repository);
    private final User account = new User();

    @BeforeEach
    void setup() {
        account.setId(1L);
        account.setName("카카오 이름");
        account.setProvider(AuthProvider.kakao);
        account.setRole(Role.ROLE_GUEST);
        account.setSignupCompleted(false);
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(account));
        when(repository.findById(1L)).thenReturn(Optional.of(account));
    }

    @ParameterizedTest
    @EnumSource(MemberType.class)
    void memberSignupPersistsIdentityAndPreventsResubmission(MemberType type) {
        assertThat(service.getMyRole(1L).isRoleAssigned()).isFalse();
        var result = service.signup(1L, new MemberSignupRequest(true, " 홍길동 ", "020260001", type));
        assertThat(account.getRole()).isEqualTo(Role.ROLE_MEMBER);
        assertThat(result.getUserName()).isEqualTo("홍길동");
        assertThat(result.getStudentNumber()).isEqualTo("020260001");
        assertThat(result.getMemberType()).isEqualTo(type);
        assertThat(result.isSignupCompleted()).isTrue();
        assertThat(service.getMyRole(1L).isRoleAssigned()).isTrue();
        assertThatThrownBy(() -> service.signup(1L, new MemberSignupRequest(false, null, null, null)))
            .isInstanceOf(ConflictException.class);
        assertThat(account.getRole()).isEqualTo(Role.ROLE_MEMBER);
    }

    @Test
    void guestSignupNeedsNoAdditionalInformation() {
        var result = service.signup(1L, new MemberSignupRequest(false, null, null, null));
        assertThat(account.getRole()).isEqualTo(Role.ROLE_GUEST);
        assertThat(result.getUserName()).isEqualTo("카카오 이름");
        assertThat(result.getStudentNumber()).isNull();
        assertThat(result.getMemberType()).isNull();
        assertThat(result.isSignupCompleted()).isTrue();
    }

    @Test
    void rejectsIncompleteMemberAndUnexpectedGuestDetailsWithoutMutatingAccount() {
        for (var request : java.util.List.of(
            new MemberSignupRequest(null, null, null, null),
            new MemberSignupRequest(true, " ", "20260001", MemberType.NEW),
            new MemberSignupRequest(true, null, "20260001", MemberType.NEW),
            new MemberSignupRequest(true, "홍길동", null, MemberType.NEW),
            new MemberSignupRequest(true, "홍길동", "20260001", null),
            new MemberSignupRequest(false, "홍길동", null, null))) {
            assertThatThrownBy(() -> service.signup(1L, request)).isInstanceOf(BadRequestException.class);
            assertThat(account.isSignupCompleted()).isFalse();
            assertThat(account.getName()).isEqualTo("카카오 이름");
            assertThat(account.getRole()).isEqualTo(Role.ROLE_GUEST);
        }
    }

    @ParameterizedTest
    @EnumSource(Role.class)
    void existingAccountsCannotReregisterOrChangeRoles(Role role) {
        account.setRole(role);
        account.setSignupCompleted(true);
        assertThatThrownBy(() -> service.signup(1L, new MemberSignupRequest(true, "홍길동", "20260001", MemberType.NEW)))
            .isInstanceOf(ConflictException.class);
        assertThat(account.getRole()).isEqualTo(role);
    }

    @Test
    void onlyPendingKakaoGuestsCanSignup() {
        account.setProvider(AuthProvider.local);
        assertThatThrownBy(() -> service.signup(1L, new MemberSignupRequest(false, null, null, null)))
            .isInstanceOf(ForbiddenException.class);
        account.setProvider(AuthProvider.kakao);
        account.setRole(Role.ROLE_ADMIN);
        assertThatThrownBy(() -> service.signup(1L, new MemberSignupRequest(false, null, null, null)))
            .isInstanceOf(ForbiddenException.class);
    }
}
