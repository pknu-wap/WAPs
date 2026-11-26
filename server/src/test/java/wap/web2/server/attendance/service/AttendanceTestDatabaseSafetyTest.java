package wap.web2.server.attendance.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class AttendanceTestDatabaseSafetyTest {
    private final DataSource dataSource = mock(DataSource.class);
    private final Connection connection = mock(Connection.class);

    @BeforeEach
    void setup() throws SQLException {
        when(dataSource.getConnection()).thenReturn(connection);
    }

    @ParameterizedTest
    @ValueSource(strings = {"attendance_test", "waps_test"})
    void permitsTestDatabasesAndClosesTheConnection(String database) throws SQLException {
        when(connection.getCatalog()).thenReturn(database);

        assertThatCode(() -> AttendanceIntegrationTest.requireTestDatabase(dataSource)).doesNotThrowAnyException();

        verify(connection).close();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"waps", "mysql", "attendance_test_backup", "test_attendance", " "})
    void rejectsOtherDatabasesAndClosesTheConnection(String database) throws SQLException {
        when(connection.getCatalog()).thenReturn(database);

        assertThatThrownBy(() -> AttendanceIntegrationTest.requireTestDatabase(dataSource))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("ATTENDANCE_TEST_URL은 이름이 _test로 끝나는 삭제 가능한 테스트 전용 DB여야 합니다.");

        verify(connection).close();
    }

    @Test
    void failsClosedWhenDatabaseLookupFailsWithoutExposingJdbcDetails() throws SQLException {
        when(connection.getCatalog()).thenThrow(new SQLException("jdbc:mysql://example.invalid/waps?password=secret"));

        assertThatThrownBy(() -> AttendanceIntegrationTest.requireTestDatabase(dataSource))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("테스트 DB 이름을 확인할 수 없습니다. ATTENDANCE_TEST_URL 설정을 확인해 주세요.")
            .hasNoCause();

        verify(connection).close();
    }

    @Test
    void failsClosedWhenConnectingFailsWithoutExposingJdbcDetails() throws SQLException {
        when(dataSource.getConnection()).thenThrow(new SQLException("jdbc:mysql://example.invalid/waps?password=secret"));

        assertThatThrownBy(() -> AttendanceIntegrationTest.requireTestDatabase(dataSource))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("테스트 DB 이름을 확인할 수 없습니다. ATTENDANCE_TEST_URL 설정을 확인해 주세요.")
            .hasNoCause();

        verifyNoInteractions(connection);
    }
}
