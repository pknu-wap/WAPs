package wap.web2.server.member;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.exception.ForbiddenException;
import wap.web2.server.member.dto.MemberSignupRequest;
import wap.web2.server.member.dto.UserRegistrationRequest;
import wap.web2.server.member.dto.UserResponse;
import wap.web2.server.member.entity.*;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.member.service.UserService;
import wap.web2.server.vote.repository.BallotRepository;

class RegistrationProfileTest {
    private final UserRepository repository = mock(UserRepository.class);
    private final UserService service = new UserService(mock(BallotRepository.class), repository);
    private final User account = new User();

    @BeforeEach
    void setup() {
        account.setId(1L);
        account.setProvider(AuthProvider.kakao);
        account.setName("기존이름");
        account.setRole(Role.ROLE_ADMIN);
        account.setMembershipLevel(MembershipLevel.REGULAR);
        account.setStudentNumber("21");
        account.setWapMember(true);
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(account));
    }

    @Test
    void editsPersistWithoutChangingAdministratorAssignedAttributes() {
        var response = service.updateRegistration(1L, new UserRegistrationRequest(true, "수정이름", "26"));
        assertThat(response.isRegistrationEditable()).isTrue();
        assertThat(response.getUserName()).isEqualTo("수정이름");
        assertThat(response.getStudentNumber()).isEqualTo("26");
        assertThat(response.getWapMember()).isTrue();
        assertThat(account.getRole()).isEqualTo(Role.ROLE_ADMIN);
        assertThat(account.getMembershipLevel()).isEqualTo(MembershipLevel.REGULAR);
        assertThat(account.isSignupCompleted()).isTrue();
        assertThat(account.getTokenVersion()).isZero();
    }

    @Test
    void choosingNonMemberClearsOnlyStudentInformation() {
        service.updateRegistration(1L, new UserRegistrationRequest(false, null, null));
        assertThat(account.getStudentNumber()).isNull();
        assertThat(account.getWapMember()).isFalse();
        assertThat(account.getName()).isEqualTo("기존이름");
        assertThat(account.getRole()).isEqualTo(Role.ROLE_ADMIN);
        assertThat(account.getMembershipLevel()).isEqualTo(MembershipLevel.REGULAR);
    }

    @Test
    void rejoiningAsANonMemberClearsThePreviousStudentNumber() {
        account.deactivate();
        account.reactivate();
        var response = service.signup(1L, new MemberSignupRequest(false, null, null, null));
        assertThat(response.getStudentNumber()).isNull();
        assertThat(response.getWapMember()).isFalse();
        assertThat(account.getRole()).isEqualTo(Role.ROLE_GUEST);
        assertThat(account.getMembershipLevel()).isEqualTo(MembershipLevel.NONE);
    }

    @Test
    void invalidEditsLeaveTheProfileIntact() {
        for (var request : java.util.List.of(
            new UserRegistrationRequest(true, " ", "26"),
            new UserRegistrationRequest(true, "다섯글자명", "26"),
            new UserRegistrationRequest(true, "회원", "2026"),
            new UserRegistrationRequest(true, "회원", null),
            new UserRegistrationRequest(null, null, null),
            new UserRegistrationRequest(false, "회원", "26")
        )) {
            assertThatThrownBy(() -> service.updateRegistration(1L, request)).isInstanceOf(BadRequestException.class);
            assertThat(account.getName()).isEqualTo("기존이름");
            assertThat(account.getStudentNumber()).isEqualTo("21");
        }
    }

    @Test
    void pendingDeletedAndLocalAccountsCannotEditThisProfile() {
        var request = new UserRegistrationRequest(true, "회원", "26");
        account.setSignupCompleted(false);
        assertThat(UserResponse.of(account).isRegistrationEditable()).isFalse();
        assertThatThrownBy(() -> service.updateRegistration(1L, request)).isInstanceOf(ForbiddenException.class);
        account.setSignupCompleted(true);
        account.setDeleted(true);
        assertThat(UserResponse.of(account).isRegistrationEditable()).isFalse();
        assertThatThrownBy(() -> service.updateRegistration(1L, request)).isInstanceOf(ForbiddenException.class);
        account.setDeleted(false);
        account.setProvider(AuthProvider.local);
        assertThat(UserResponse.of(account).isRegistrationEditable()).isFalse();
        assertThatThrownBy(() -> service.updateRegistration(1L, request)).isInstanceOf(ForbiddenException.class);
    }
}
