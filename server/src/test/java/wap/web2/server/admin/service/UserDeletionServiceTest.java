package wap.web2.server.admin.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import wap.web2.server.exception.BadRequestException;

class UserDeletionServiceTest {
    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final UserDeletionService service = new UserDeletionService(jdbc);

    @Test
    void selfDeletionIsRejectedBeforeAnyDatabaseChange() {
        assertThatThrownBy(() -> service.deleteUsers(List.of(1L), 1L))
            .isInstanceOf(BadRequestException.class);
        verifyNoInteractions(jdbc);
    }

    @Test
    void missingUsersRejectTheWholeSelection() {
        when(jdbc.queryForList(anyString(), anyMap(), eq(Long.class))).thenReturn(List.of(2L));
        assertThatThrownBy(() -> service.deleteUsers(List.of(2L, 3L), 1L))
            .isInstanceOf(BadRequestException.class);
        verify(jdbc, never()).update(anyString(), anyMap());
    }

    @Test
    void projectOwnersAreRejectedWithoutDeletingTheirProjects() {
        when(jdbc.queryForList(anyString(), anyMap(), eq(Long.class))).thenReturn(List.of(2L));
        when(jdbc.queryForObject(anyString(), anyMap(), eq(Integer.class))).thenReturn(1);
        assertThatThrownBy(() -> service.deleteUsers(List.of(2L), 1L))
            .isInstanceOf(BadRequestException.class);
        verify(jdbc, never()).update(anyString(), anyMap());
    }

    @Test
    void deletesRelatedRecordsBeforeDeletingAccountsAndDeduplicatesIds() {
        when(jdbc.queryForList(anyString(), anyMap(), eq(Long.class))).thenReturn(List.of(2L));
        when(jdbc.queryForObject(anyString(), anyMap(), eq(Integer.class))).thenReturn(0);
        service.deleteUsers(List.of(2L, 2L), 1L);
        var order = inOrder(jdbc);
        Map<String, Object> params = Map.of("ids", List.of(2L));
        order.verify(jdbc).update("DELETE FROM refresh_token WHERE user_id IN (:ids)", params);
        order.verify(jdbc).update("DELETE FROM project_apply WHERE user_id IN (:ids)", params);
        order.verify(jdbc).update("DELETE FROM user WHERE user_id IN (:ids)", params);
    }
}
