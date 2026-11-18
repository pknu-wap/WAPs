package wap.web2.server.admin.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import jakarta.validation.Validation;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import wap.web2.server.admin.dto.request.UserAttributesChangeRequest;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.member.entity.MemberType;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;

class UserAttributesChangeServiceTest {
    private final UserRepository repository = mock(UserRepository.class);
    private final UserRoleService service = new UserRoleService(repository);

    private User member(long id) {
        User user = new User();
        user.setId(id);
        user.setRole(Role.ROLE_MEMBER);
        user.setMemberType(MemberType.NEW);
        return user;
    }

    @Test
    void combinedChangeReturnsBothSavedAttributesForEverySelectedUser() {
        User first = member(1L);
        User second = member(2L);
        when(repository.findAllById(List.of(1L, 2L))).thenReturn(List.of(first, second));
        var result = service.changeAttributes(new UserAttributesChangeRequest(
            List.of(1L, 2L, 1L), Role.ROLE_ADMIN, MemberType.REGULAR
        ));
        assertThat(result).hasSize(2).allSatisfy(user -> {
            assertThat(user.role()).isEqualTo(Role.ROLE_ADMIN);
            assertThat(user.memberType()).isEqualTo(MemberType.REGULAR);
        });
        assertThat(first.getRole()).isEqualTo(Role.ROLE_ADMIN);
        assertThat(second.getMemberType()).isEqualTo(MemberType.REGULAR);
    }

    @Test
    void omittedAttributesArePreservedAndExplicitUndecidedCanBeSaved() {
        User user = member(1L);
        when(repository.findAllById(List.of(1L))).thenReturn(List.of(user));
        service.changeAttributes(new UserAttributesChangeRequest(List.of(1L), Role.ROLE_GUEST, null));
        assertThat(user.getMemberType()).isEqualTo(MemberType.NEW);
        service.changeAttributes(new UserAttributesChangeRequest(List.of(1L), null, MemberType.UNDECIDED));
        assertThat(user.getRole()).isEqualTo(Role.ROLE_GUEST);
        assertThat(user.getMemberType()).isEqualTo(MemberType.UNDECIDED);
    }

    @Test
    void missingUserRejectsBothChangesBeforeAnySelectedUserIsModified() {
        User user = member(1L);
        when(repository.findAllById(List.of(1L, 2L))).thenReturn(List.of(user));
        assertThatThrownBy(() -> service.changeAttributes(new UserAttributesChangeRequest(
            List.of(1L, 2L), Role.ROLE_ADMIN, MemberType.REGULAR
        ))).isInstanceOf(BadRequestException.class);
        assertThat(user.getRole()).isEqualTo(Role.ROLE_MEMBER);
        assertThat(user.getMemberType()).isEqualTo(MemberType.NEW);
    }

    @Test
    void invalidRequestsAreRejectedByValidationAndService() {
        var invalidRequests = List.of(
            new UserAttributesChangeRequest(List.of(1L), null, null),
            new UserAttributesChangeRequest(List.of(1L), Role.ROLE_USER, MemberType.NEW),
            new UserAttributesChangeRequest(List.of(), Role.ROLE_MEMBER, null),
            new UserAttributesChangeRequest(null, null, MemberType.NEW),
            new UserAttributesChangeRequest(Arrays.asList(1L, null), null, MemberType.NEW),
            new UserAttributesChangeRequest(List.of(0L), Role.ROLE_MEMBER, null)
        );
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            invalidRequests.forEach(request -> {
                assertThat(validator.validate(request)).isNotEmpty();
                assertThatThrownBy(() -> service.changeAttributes(request)).isInstanceOf(BadRequestException.class);
            });
        }
        verifyNoInteractions(repository);
    }
}
