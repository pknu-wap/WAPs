package wap.web2.server.member;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import jakarta.validation.Validation;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import wap.web2.server.admin.dto.request.MembershipLevelChangeRequest;
import wap.web2.server.admin.dto.response.UserRoleResponse;
import wap.web2.server.admin.service.UserRoleService;
import wap.web2.server.member.entity.*;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.member.service.UserService;
import wap.web2.server.vote.repository.BallotRepository;

class MembershipLevelTest {
    @ParameterizedTest
    @EnumSource(MembershipLevel.class)
    void changesLevelIndependentlyAndExposesIt(MembershipLevel level) {
        var users = mock(UserRepository.class);
        var user = new User();
        assertThat(user.getMembershipLevel()).isEqualTo(MembershipLevel.NONE);
        assertThat(user.getRole()).isEqualTo(Role.ROLE_GUEST);
        user.setRole(Role.ROLE_MEMBER);
        user.setMembershipLevel(level);
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(users.updateMembershipLevelByIds(level, List.of(1L))).thenReturn(1);
        var result = new UserRoleService(users).changeMembershipLevel(
            new MembershipLevelChangeRequest(level, List.of(1L)));
        assertThat(result.updatedUserCount()).isEqualTo(1);
        assertThat(result.changeTo()).isEqualTo(level);
        verify(users, never()).updateRoleByIds(any(), any());
        assertThat(UserRoleResponse.from(user).membershipLevel()).isEqualTo(level);
        var mine = new UserService(mock(BallotRepository.class), users).getMyRole(1L);
        assertThat(mine.getMembershipLevel()).isEqualTo(level);
        assertThat(mine.getRole()).isEqualTo(Role.ROLE_MEMBER);
    }

    @Test
    void emptySelectionDoesNotUpdateAndInvalidInputIsRejected() {
        var users = mock(UserRepository.class);
        var result = new UserRoleService(users).changeMembershipLevel(
            new MembershipLevelChangeRequest(MembershipLevel.NEW, List.of()));
        assertThat(result.updatedUserCount()).isZero();
        verifyNoInteractions(users);
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertThat(validator.validate(new MembershipLevelChangeRequest(null, List.of(1L)))).isNotEmpty();
            assertThat(validator.validate(new MembershipLevelChangeRequest(MembershipLevel.NEW, null))).isNotEmpty();
            assertThat(validator.validate(new MembershipLevelChangeRequest(MembershipLevel.NEW, List.of(-1L)))).isNotEmpty();
        }
    }
}
