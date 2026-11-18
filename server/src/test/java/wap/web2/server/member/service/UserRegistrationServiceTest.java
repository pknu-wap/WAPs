package wap.web2.server.member.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.exception.ForbiddenException;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.member.dto.UserRegistrationRequest;
import wap.web2.server.member.entity.AuthProvider;
import wap.web2.server.member.entity.MemberType;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.vote.repository.BallotRepository;

class UserRegistrationServiceTest {
    private final UserRepository repository = mock(UserRepository.class);
    private final UserService service = new UserService(mock(BallotRepository.class), repository);
    private final UserPrincipal principal = new UserPrincipal(1L, "user@example.invalid", null, List.of());
    private final User user = new User();

    @BeforeEach
    void setUp() {
        user.setName("카카오 이름");
        user.setProvider(AuthProvider.kakao);
        user.setRegistrationRequired(true);
        user.setRole(Role.ROLE_GUEST);
        user.setMemberType(MemberType.ASSOCIATE);
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(user));
    }

    @Test
    void memberClaimStoresTrimmedProfileAndPreservesRoleAndLevel() {
        var response = service.completeRegistration(
            principal, new UserRegistrationRequest(true, "  김개발  ", "01")
        );

        assertThat(response.isRegistrationRequired()).isFalse();
        assertThat(response.getUserName()).isEqualTo("김개발");
        assertThat(user.getWapMember()).isTrue();
        assertThat(user.getStudentId()).isEqualTo("01");
        assertThat(user.getRole()).isEqualTo(Role.ROLE_GUEST);
        assertThat(user.getMemberType()).isEqualTo(MemberType.ASSOCIATE);
    }

    @Test
    void nonMemberRetainsKakaoNameAndDoesNotStoreStudentId() {
        var response = service.completeRegistration(
            principal, new UserRegistrationRequest(false, "다른 이름", "01")
        );

        assertThat(response.isRegistrationRequired()).isFalse();
        assertThat(response.getUserName()).isEqualTo("카카오 이름");
        assertThat(user.getWapMember()).isFalse();
        assertThat(user.getStudentId()).isNull();
    }

    @Test
    void invalidMemberDetailsLeaveRegistrationPending() {
        List<UserRegistrationRequest> invalidRequests = List.of(
            new UserRegistrationRequest(true, null, "01"),
            new UserRegistrationRequest(true, "  ", "01"),
            new UserRegistrationRequest(true, "가".repeat(5), "01"),
            new UserRegistrationRequest(true, "김개발", null),
            new UserRegistrationRequest(true, "김개발", "12345678"),
            new UserRegistrationRequest(true, "김개발", "０１２３４５６７８")
        );

        for (var request : invalidRequests) {
            assertThatThrownBy(() -> service.completeRegistration(principal, request))
                .isInstanceOf(BadRequestException.class);
            assertThat(user.isRegistrationRequired()).isTrue();
            assertThat(user.getName()).isEqualTo("카카오 이름");
            assertThat(user.getWapMember()).isNull();
            assertThat(user.getStudentId()).isNull();
        }
    }

    @Test
    void completedRegistrationReturnsCurrentProfileWithoutRewritingIt() {
        service.completeRegistration(principal, new UserRegistrationRequest(true, "김개발", "01"));

        var retry = service.completeRegistration(principal, new UserRegistrationRequest(false, null, null));

        assertThat(retry.isRegistrationRequired()).isFalse();
        assertThat(retry.getUserName()).isEqualTo("김개발");
        assertThat(user.getWapMember()).isTrue();
        assertThat(user.getStudentId()).isEqualTo("01");
    }

    @Test
    void localAccountsCannotCompleteKakaoRegistration() {
        user.setProvider(AuthProvider.local);

        assertThatThrownBy(() -> service.completeRegistration(
            principal, new UserRegistrationRequest(false, null, null)
        )).isInstanceOf(ForbiddenException.class);
        assertThat(user.isRegistrationRequired()).isTrue();
    }

    @Test
    void selfServiceRoleRouteOnlyAllowsTheCurrentRoleWithoutWriting() {
        when(repository.findById(1L)).thenReturn(Optional.of(user));

        service.setRole(principal, "ROLE_GUEST");
        assertThatThrownBy(() -> service.setRole(principal, "ROLE_MEMBER"))
            .isInstanceOf(ForbiddenException.class);

        assertThat(user.getRole()).isEqualTo(Role.ROLE_GUEST);
        verify(repository, times(2)).findById(1L);
        verifyNoMoreInteractions(repository);
    }

    @Test
    void completedRegistrationCanBeEditedWithoutChangingPrivileges() {
        user.setRegistrationRequired(false);
        var response = service.updateRegistration(principal, new UserRegistrationRequest(true, "수정이름", "23"));
        assertThat(response.getStudentId()).isEqualTo("23");
        assertThat(response.getWapMember()).isTrue();
        assertThat(response.getUserName()).isEqualTo("수정이름");
        assertThat(user.getRole()).isEqualTo(Role.ROLE_GUEST);
        assertThat(user.getMemberType()).isEqualTo(MemberType.ASSOCIATE);
        service.updateRegistration(principal, new UserRegistrationRequest(false, null, null));
        assertThat(user.getStudentId()).isNull();
        assertThat(user.getWapMember()).isFalse();
    }

    @Test
    void missingMembershipChoiceCannotCompleteRegistration() {
        assertThatThrownBy(() -> service.completeRegistration(
            principal, new UserRegistrationRequest(null, null, null)
        )).isInstanceOf(BadRequestException.class);
        assertThat(user.isRegistrationRequired()).isTrue();
    }
}
