package wap.web2.server.admin.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import org.junit.jupiter.api.Test;
import wap.web2.server.admin.dto.request.MemberTypeChangeRequest;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.member.entity.*;
import wap.web2.server.member.repository.UserRepository;

class UserMemberTypeServiceTest {
    private final UserRepository repository = mock(UserRepository.class);
    private final UserRoleService service = new UserRoleService(repository);

    @Test
    void membershipChangesDoNotChangeAuthorization() {
        User user = new User();
        user.setId(1L);
        user.setRole(Role.ROLE_ADMIN);
        when(repository.findAllById(List.of(1L))).thenReturn(List.of(user));
        for (MemberType type : MemberType.values()) {
            var result = service.changeMemberType(new MemberTypeChangeRequest(type, List.of(1L, 1L)));
            assertThat(result).hasSize(1);
            assertThat(result.get(0).memberType()).isEqualTo(type);
            assertThat(user.getMemberType()).isEqualTo(type);
            assertThat(user.getRole()).isEqualTo(Role.ROLE_ADMIN);
        }
    }

    @Test
    void unknownUsersRejectTheWholeChange() {
        User user = new User();
        user.setId(1L);
        user.setMemberType(MemberType.NEW);
        when(repository.findAllById(List.of(1L, 2L))).thenReturn(List.of(user));
        assertThatThrownBy(() -> service.changeMemberType(
            new MemberTypeChangeRequest(MemberType.REGULAR, List.of(1L, 2L))
        )).isInstanceOf(BadRequestException.class);
        assertThat(user.getMemberType()).isEqualTo(MemberType.NEW);
    }

    @Test
    void roleAndLevelFiltersAreCombinedBeforePagination() {
        when(repository.findUserByOffsetAndMemberType(13, 12, Role.ROLE_MEMBER, MemberType.ASSOCIATE))
            .thenReturn(List.of());
        var result = service.getUsersForAdmin(12, 1, Role.ROLE_MEMBER, MemberType.ASSOCIATE);
        assertThat(result.content()).isEmpty();
        assertThat(result.hasNext()).isFalse();
        verify(repository).findUserByOffsetAndMemberType(13, 12, Role.ROLE_MEMBER, MemberType.ASSOCIATE);
    }
}
