package wap.web2.server.attendance.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.sql.SQLException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import javax.sql.DataSource;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.orm.jpa.*;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.transaction.support.TransactionTemplate;
import wap.web2.server.attendance.dto.AttendanceRequests;
import wap.web2.server.attendance.dto.AttendanceResponses;
import wap.web2.server.attendance.entity.*;
import wap.web2.server.attendance.repository.*;
import wap.web2.server.exception.*;
import wap.web2.server.member.entity.*;
import wap.web2.server.member.repository.UserRepository;

/** Recreates tables: ATTENDANCE_TEST_URL must point to a disposable MySQL database whose name ends in _test. */
@EnabledIfEnvironmentVariable(named = "ATTENDANCE_TEST_URL", matches = ".+")
class AttendanceIntegrationTest {
    private LocalContainerEntityManagerFactoryBean factory;
    private TransactionTemplate transaction;
    private AttendanceRepository attendances;
    private AttendanceParticipantRepository participants;
    private UserRepository users;
    private AttendanceService service;
    private JdbcTemplate jdbc;
    private final Clock clock = mock(Clock.class);
    private final Instant now = Instant.parse("2026-10-10T10:00:00.123456Z");
    private final LocalDate today = LocalDate.of(2026, 10, 10);
    private final ExecutorService executor = Executors.newFixedThreadPool(4);
    private final CountDownLatch release = new CountDownLatch(1);

    @BeforeEach
    void setup() {
        var dataSource = new DriverManagerDataSource(System.getenv("ATTENDANCE_TEST_URL"), "root", "");
        // Hibernate의 create-drop이 실행되기 전에 실제 연결 대상 DB를 검증한다.
        requireTestDatabase(dataSource);
        factory = new LocalContainerEntityManagerFactoryBean();
        factory.setDataSource(dataSource);
        factory.setPackagesToScan("wap.web2.server");
        factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        factory.setJpaPropertyMap(Map.of(
            "hibernate.hbm2ddl.auto", "create-drop",
            "hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy",
            "hibernate.jdbc.time_zone", "UTC"));
        factory.afterPropertiesSet();
        jdbc = new JdbcTemplate(dataSource);
        jdbc.execute("DROP TABLE attendance_participant");
        jdbc.execute("DROP TABLE attendance");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V13__create_attendances.sql"),
            new ClassPathResource("db/migration/V14__persist_attendance_status.sql"))
            .execute(dataSource);
        var entityManager = SharedEntityManagerCreator.createSharedEntityManager(factory.getObject());
        var repositories = new JpaRepositoryFactory(entityManager);
        attendances = repositories.getRepository(AttendanceRepository.class);
        participants = repositories.getRepository(AttendanceParticipantRepository.class);
        users = repositories.getRepository(UserRepository.class);
        var manager = new JpaTransactionManager(factory.getObject());
        transaction = new TransactionTemplate(manager);
        var proxy = new ProxyFactory(new AttendanceService(attendances, participants, users, clock));
        proxy.addAdvice(new TransactionInterceptor(manager, new AnnotationTransactionAttributeSource()));
        service = (AttendanceService) proxy.getProxy();
        when(clock.instant()).thenReturn(now);
    }

    static void requireTestDatabase(DataSource dataSource) {
        String database;
        try (var connection = dataSource.getConnection()) {
            database = connection.getCatalog();
        } catch (SQLException exception) {
            // 접속 URL이나 인증 정보가 포함될 수 있는 JDBC 예외를 노출하지 않는다.
            throw new IllegalStateException("테스트 DB 이름을 확인할 수 없습니다. ATTENDANCE_TEST_URL 설정을 확인해 주세요.");
        }
        if (database == null || !database.endsWith("_test")) {
            throw new IllegalStateException("ATTENDANCE_TEST_URL은 이름이 _test로 끝나는 삭제 가능한 테스트 전용 DB여야 합니다.");
        }
    }

    @AfterEach
    void cleanup() throws InterruptedException {
        release.countDown();
        executor.shutdownNow();
        executor.awaitTermination(10, TimeUnit.SECONDS);
        if (factory != null) factory.destroy();
    }

    @Test
    void migrationPreservesExistingStatusesAndDefaultsNewRowsToScheduled() {
        jdbc.execute("ALTER TABLE attendance DROP COLUMN status");
        jdbc.update("""
            INSERT INTO attendance (title, date) VALUES
                ('과거', DATE(UTC_TIMESTAMP() + INTERVAL 9 HOUR) - INTERVAL 1 DAY),
                ('오늘', DATE(UTC_TIMESTAMP() + INTERVAL 9 HOUR)),
                ('미래', DATE(UTC_TIMESTAMP() + INTERVAL 9 HOUR) + INTERVAL 1 DAY)
            """);
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V14__persist_attendance_status.sql"))
            .execute(jdbc.getDataSource());
        assertThat(jdbc.queryForList("SELECT status FROM attendance ORDER BY id", String.class))
            .containsExactly("ENDED", "ONGOING", "SCHEDULED");
        jdbc.update("INSERT INTO attendance (title, date) VALUES ('신규', DATE(UTC_TIMESTAMP() + INTERVAL 9 HOUR))");
        assertThat(jdbc.queryForObject("SELECT status FROM attendance WHERE title = '신규'", String.class))
            .isEqualTo("SCHEDULED");
        for (LocalDate date : List.of(today, today.plusDays(1))) {
            var created = service.create(new AttendanceRequests.Create("신규 출석", date));
            assertThat(created.status()).isEqualTo(AttendanceStatus.SCHEDULED);
            assertThat(service.detail(created.attendanceId(), null, "userName,asc").summary().status())
                .isEqualTo(AttendanceStatus.SCHEDULED);
        }
    }

    @Test
    void migrationSupportsEmptyEventsFixedTargetsCountsAndOrderedUserHistory() {
        long empty = create(today);
        assertThat(service.listAdmin(null).content().get(0).totalCount()).isZero();
        assertThat(service.detail(empty, null, "userName,asc").participants().content()).isEmpty();
        long first = user("가", Role.ROLE_GUEST);
        long second = user("나", Role.ROLE_ADMIN);
        long event = create(today);
        long laterId = create(today);
        long future = service.create(new AttendanceRequests.Create("미래", today.plusDays(1))).attendanceId();
        long outsider = user("다", Role.ROLE_MEMBER);
        String token = service.issueQr(event).qrToken();
        service.checkIn(event, first, token);
        assertThatThrownBy(() -> service.checkIn(event, outsider, token)).isInstanceOf(ForbiddenException.class);
        assertThat(service.listMine(outsider, AttendanceStatus.ONGOING)).isEmpty();
        assertThat(service.listMine(outsider, AttendanceStatus.SCHEDULED)).isEmpty();
        assertThat(service.listMine(first, AttendanceStatus.SCHEDULED)).extracting(AttendanceResponses.MyAttendance::attendanceId)
            .containsExactly(future);
        assertThat(service.listMine(first, AttendanceStatus.ONGOING)).extracting(AttendanceResponses.MyAttendance::attendanceId)
            .containsExactly(laterId, event);
        assertThat(service.listAdmin(null).content()).extracting(AttendanceResponses.Summary::attendanceId)
            .containsExactly(future, laterId, event, empty);
        assertThat(service.listAdmin(AttendanceStatus.SCHEDULED).content()).hasSize(1);
        var detail = service.detail(event, PresenceStatus.ABSENT, "status,asc");
        assertThat(detail.summary().totalCount()).isEqualTo(2);
        assertThat(detail.summary().presentCount()).isEqualTo(1);
        assertThat(detail.participants().content()).extracting(AttendanceResponses.Participant::userId).containsExactly(second);
        assertThat(service.listAdmin(AttendanceStatus.ONGOING).content().stream()
            .filter(a -> a.attendanceId() == event).findFirst().orElseThrow().presentCount()).isEqualTo(1);
        assertThatThrownBy(() -> transaction.executeWithoutResult(ignored -> participants.saveAndFlush(
            new AttendanceParticipant(attendances.findById(event).orElseThrow(), first, "중복"))))
            .isInstanceOf(org.hibernate.exception.ConstraintViolationException.class);
        when(clock.instant()).thenReturn(Instant.parse("2026-10-10T15:00:00Z"));
        assertThat(service.listMine(first, AttendanceStatus.ENDED)).isEmpty();
        assertThat(service.listMine(first, AttendanceStatus.ONGOING)).extracting(AttendanceResponses.MyAttendance::attendanceId)
            .containsExactly(laterId, event);
        assertThat(service.detail(future, null, "userName,asc").summary().status()).isEqualTo(AttendanceStatus.SCHEDULED);
        changeStatus(event, AttendanceStatus.ENDED);
        changeStatus(laterId, AttendanceStatus.ENDED);
        changeStatus(future, AttendanceStatus.ONGOING);
        assertThat(service.listMine(first, AttendanceStatus.SCHEDULED)).isEmpty();
        assertThat(service.listMine(first, AttendanceStatus.ENDED)).extracting(AttendanceResponses.MyAttendance::attendanceId)
            .containsExactly(laterId, event);
        assertThat(service.listMine(first, AttendanceStatus.ONGOING)).extracting(AttendanceResponses.MyAttendance::attendanceId)
            .containsExactly(future);
    }

    @Test
    void statusFiltersLimitDatabaseResultsAndEntityLoadsWhilePreservingOrder() {
        long userId = user("가", Role.ROLE_MEMBER);
        long first = create(today);
        long second = create(today);
        service.create(new AttendanceRequests.Create("예정", today.plusDays(1)));
        long ended = create(today);
        changeStatus(ended, AttendanceStatus.ENDED);
        service.checkIn(first, userId, service.issueQr(first).qrToken());
        var statistics = factory.getObject().unwrap(org.hibernate.SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();

        var summaries = service.listAdmin(AttendanceStatus.ONGOING).content();
        assertThat(summaries).extracting(AttendanceResponses.Summary::attendanceId).containsExactly(second, first);
        assertThat(summaries.get(1).presentCount()).isEqualTo(1);
        assertThat(statistics.getQueryExecutionCount()).isEqualTo(1);
        assertThat(statistics.getQueryStatistics(statistics.getQueries()[0]).getExecutionRowCount()).isEqualTo(2);
        assertThat(statistics.getEntityLoadCount()).isZero();

        statistics.clear();
        var mine = service.listMine(userId, AttendanceStatus.ONGOING);
        assertThat(mine).extracting(AttendanceResponses.MyAttendance::attendanceId).containsExactly(second, first);
        assertThat(mine.get(1).myStatus()).isEqualTo(PresenceStatus.PRESENT);
        assertThat(statistics.getQueryExecutionCount()).isEqualTo(1);
        assertThat(statistics.getQueryStatistics(statistics.getQueries()[0]).getExecutionRowCount()).isEqualTo(2);
        assertThat(statistics.getEntityLoadCount()).isEqualTo(4);
    }

    @Test
    void manualStatusChangesControlCheckInAndPreserveRecordsAcrossReopening() {
        long userId = user("가", Role.ROLE_MEMBER);
        user("나", Role.ROLE_USER);
        var created = service.create(new AttendanceRequests.Create("미래 행사", today.plusDays(1)));
        long event = created.attendanceId();
        assertThat(created.status()).isEqualTo(AttendanceStatus.SCHEDULED);
        assertThatThrownBy(() -> service.issueQr(event)).isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> service.checkIn(event, userId, "unissued")).isInstanceOf(ConflictException.class);

        changeStatus(event, AttendanceStatus.ONGOING);
        assertThat(service.listMine(userId, AttendanceStatus.ONGOING)).extracting(AttendanceResponses.MyAttendance::attendanceId)
            .containsExactly(event);
        String token = service.issueQr(event).qrToken();
        changeStatus(event, AttendanceStatus.ONGOING);
        var checkedIn = service.checkIn(event, userId, token);
        service.update(event, userId, new AttendanceRequests.Update(null, "확인"));
        var ended = service.changeStatus(event, new AttendanceRequests.ChangeStatus(AttendanceStatus.ENDED));
        assertThat(ended.status()).isEqualTo(AttendanceStatus.ENDED);
        assertThat(ended.totalCount()).isEqualTo(2);
        assertThat(ended.presentCount()).isEqualTo(1);
        assertThat(ended.absentCount()).isEqualTo(1);
        assertThat(service.listMine(userId, AttendanceStatus.ONGOING)).isEmpty();
        assertThat(service.listMine(userId, AttendanceStatus.ENDED)).extracting(AttendanceResponses.MyAttendance::attendanceId)
            .containsExactly(event);
        assertThatThrownBy(() -> service.issueQr(event)).isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> service.checkIn(event, userId, token)).isInstanceOf(ConflictException.class);

        changeStatus(event, AttendanceStatus.ONGOING);
        assertThatThrownBy(() -> service.checkIn(event, userId, token)).isInstanceOf(BadRequestException.class);
        String newToken = service.issueQr(event).qrToken();
        assertThat(service.checkIn(event, userId, newToken).checkedInAt()).isEqualTo(checkedIn.checkedInAt());
        changeStatus(event, AttendanceStatus.SCHEDULED);
        var detail = service.detail(event, null, "userName,asc");
        assertThat(detail.summary().status()).isEqualTo(AttendanceStatus.SCHEDULED);
        assertThat(detail.summary().presentCount()).isEqualTo(1);
        assertThat(detail.participants().content().get(0).checkedInAt()).isEqualTo(checkedIn.checkedInAt());
        assertThat(detail.participants().content().get(0).note()).isEqualTo("확인");
        assertThat(service.listMine(userId, AttendanceStatus.ONGOING)).isEmpty();
        assertThat(service.listMine(userId, AttendanceStatus.ENDED)).isEmpty();
    }

    @Test
    void checkInAndQrIssueWaitForStatusChangeAndRejectAnEndedAttendance() throws Exception {
        long userId = user("가", Role.ROLE_MEMBER);
        long event = create(today);
        String token = service.issueQr(event).qrToken();
        var changed = new CountDownLatch(1);
        var ending = executor.submit(() -> transaction.execute(ignored -> {
            var result = service.changeStatus(event, new AttendanceRequests.ChangeStatus(AttendanceStatus.ENDED));
            changed.countDown(); await(release); return result;
        }));
        await(changed);
        var started = new CountDownLatch(2);
        var checkIn = executor.submit(() -> { started.countDown(); return service.checkIn(event, userId, token); });
        var issue = executor.submit(() -> { started.countDown(); return service.issueQr(event); });
        await(started);
        assertThatThrownBy(() -> checkIn.get(200, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
        assertThatThrownBy(() -> issue.get(200, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
        release.countDown();
        assertThat(ending.get(10, TimeUnit.SECONDS).status()).isEqualTo(AttendanceStatus.ENDED);
        assertThatThrownBy(() -> checkIn.get(10, TimeUnit.SECONDS))
            .isInstanceOf(ExecutionException.class).hasCauseInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> issue.get(10, TimeUnit.SECONDS))
            .isInstanceOf(ExecutionException.class).hasCauseInstanceOf(ConflictException.class);
        assertThat(service.detail(event, null, "userName,asc").summary().presentCount()).isZero();
    }

    @Test
    void statusChangesAndDeletionDoNotLoadParticipantEntities() {
        long empty = create(today);
        var emptySummary = service.changeStatus(empty, new AttendanceRequests.ChangeStatus(AttendanceStatus.ENDED));
        assertThat(emptySummary.totalCount()).isZero();
        assertThat(emptySummary.presentCount()).isZero();
        assertThat(emptySummary.absentCount()).isZero();

        long userId = user("가", Role.ROLE_MEMBER);
        user("나", Role.ROLE_USER);
        long event = create(today);
        long retained = create(today);
        service.checkIn(event, userId, service.issueQr(event).qrToken());
        var statistics = factory.getObject().unwrap(org.hibernate.SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();

        var summary = service.changeStatus(event, new AttendanceRequests.ChangeStatus(AttendanceStatus.ENDED));
        assertThat(summary.status()).isEqualTo(AttendanceStatus.ENDED);
        assertThat(summary.totalCount()).isEqualTo(2);
        assertThat(summary.presentCount()).isEqualTo(1);
        assertThat(summary.absentCount()).isEqualTo(1);
        assertThat(statistics.getEntityLoadCount()).isEqualTo(1); // 잠근 행사만 로딩한다.
        assertThat(statistics.getEntityStatistics(AttendanceParticipant.class.getName()).getLoadCount()).isZero();

        statistics.clear();
        service.delete(event);
        assertThat(statistics.getEntityLoadCount()).isEqualTo(1);
        assertThat(statistics.getEntityStatistics(AttendanceParticipant.class.getName()).getLoadCount()).isZero();
        assertThat(attendances.existsById(event)).isFalse();
        assertThat(participants.findByAttendanceId(event)).isEmpty();
        assertThat(participants.findByAttendanceId(retained)).hasSize(2);
    }

    @Test
    void deletionRemovesOnlyTheSelectedAttendanceAndItsParticipantsInEveryStatus() {
        long empty = create(today);
        service.delete(empty);
        assertThat(attendances.existsById(empty)).isFalse();

        long first = user("가", Role.ROLE_MEMBER);
        user("나", Role.ROLE_USER);
        long retained = create(today);
        service.update(retained, first, new AttendanceRequests.Update(PresenceStatus.PRESENT, "보존"));
        for (AttendanceStatus status : AttendanceStatus.values()) {
            long event = create(today);
            service.update(event, first, new AttendanceRequests.Update(PresenceStatus.PRESENT, "확인"));
            changeStatus(event, status);
            service.delete(event);
            assertThat(attendances.existsById(event)).isFalse();
            assertThat(participants.findByAttendanceId(event)).isEmpty();
            assertThatThrownBy(() -> service.delete(event)).isInstanceOf(ResourceNotFoundException.class);
            assertThatThrownBy(() -> service.detail(event, null, "userName,asc")).isInstanceOf(ResourceNotFoundException.class);
        }
        assertThat(service.listAdmin(null).content()).extracting(AttendanceResponses.Summary::attendanceId)
            .containsExactly(retained);
        assertThat(service.listMine(first, AttendanceStatus.ONGOING)).extracting(AttendanceResponses.MyAttendance::attendanceId)
            .containsExactly(retained);
        assertThat(participants.count()).isEqualTo(2);
        assertThat(users.count()).isEqualTo(2);
        var preserved = service.detail(retained, null, "userName,asc");
        assertThat(preserved.summary().presentCount()).isEqualTo(1);
        assertThat(preserved.participants().content().get(0).note()).isEqualTo("보존");
    }

    @Test
    void failedDeletionRollsBackBothAttendanceAndParticipantRecords() {
        long userId = user("가", Role.ROLE_MEMBER);
        long event = create(today);
        String token = service.issueQr(event).qrToken();
        var checkedIn = service.checkIn(event, userId, token);
        service.update(event, userId, new AttendanceRequests.Update(null, "확인"));
        assertThatThrownBy(() -> transaction.executeWithoutResult(ignored -> {
            service.delete(event);
            attendances.flush();
            throw new IllegalStateException("rollback");
        })).isInstanceOf(IllegalStateException.class).hasMessage("rollback");
        var detail = service.detail(event, null, "userName,asc");
        assertThat(detail.summary().status()).isEqualTo(AttendanceStatus.ONGOING);
        assertThat(detail.summary().presentCount()).isEqualTo(1);
        assertThat(detail.participants().content().get(0).note()).isEqualTo("확인");
        assertThat(service.checkIn(event, userId, token).checkedInAt()).isEqualTo(checkedIn.checkedInAt());
    }

    @Test
    void checkInAndQrIssueWaitForDeletionAndReturnNotFound() throws Exception {
        long userId = user("가", Role.ROLE_MEMBER);
        long event = create(today);
        String token = service.issueQr(event).qrToken();
        var deleted = new CountDownLatch(1);
        var deletion = executor.submit(() -> transaction.executeWithoutResult(ignored -> {
            service.delete(event);
            deleted.countDown(); await(release);
        }));
        await(deleted);
        var started = new CountDownLatch(2);
        var checkIn = executor.submit(() -> { started.countDown(); return service.checkIn(event, userId, token); });
        var issue = executor.submit(() -> { started.countDown(); return service.issueQr(event); });
        await(started);
        assertThatThrownBy(() -> checkIn.get(200, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
        assertThatThrownBy(() -> issue.get(200, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
        release.countDown();
        deletion.get(10, TimeUnit.SECONDS);
        assertThatThrownBy(() -> checkIn.get(10, TimeUnit.SECONDS))
            .isInstanceOf(ExecutionException.class).hasCauseInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> issue.get(10, TimeUnit.SECONDS))
            .isInstanceOf(ExecutionException.class).hasCauseInstanceOf(ResourceNotFoundException.class);
        assertThat(attendances.existsById(event)).isFalse();
        assertThat(participants.findByAttendanceId(event)).isEmpty();
    }

    @Test
    void simultaneousCheckInsRecordOneTimestampAndPreserveNotes() throws Exception {
        long userId = user("가", Role.ROLE_USER);
        long otherId = user("나", Role.ROLE_MEMBER);
        long event = create(today);
        service.update(event, userId, new AttendanceRequests.Update(null, "관리자 확인"));
        String token = service.issueQr(event).qrToken();
        var ticks = new AtomicLong();
        when(clock.instant()).thenAnswer(ignored -> now.plusNanos(ticks.incrementAndGet() * 1000));
        var start = new CountDownLatch(1);
        var requests = new ArrayList<Future<AttendanceResponses.CheckIn>>();
        for (int i = 0; i < 12; i++) {
            requests.add(executor.submit(() -> { await(start); return service.checkIn(event, userId, token); }));
        }
        start.countDown();
        Instant first = requests.get(0).get(10, TimeUnit.SECONDS).checkedInAt();
        for (var result : requests) assertThat(result.get(10, TimeUnit.SECONDS).checkedInAt()).isEqualTo(first);
        assertThat(service.detail(event, null, "userName,asc").summary().presentCount()).isEqualTo(1);
        service.checkIn(event, otherId, token);
        var detail = service.detail(event, null, "userName,asc");
        assertThat(detail.summary().presentCount()).isEqualTo(2);
        assertThat(detail.participants().content().get(0).note()).isEqualTo("관리자 확인");
        assertThat(participants.count()).isEqualTo(2);
    }

    @Test
    void checkInWaitsForReissueAndRejectsThePreviousToken() throws Exception {
        long userId = user("가", Role.ROLE_MEMBER);
        long event = create(today);
        String old = service.issueQr(event).qrToken();
        var issued = new CountDownLatch(1);
        var reissue = executor.submit(() -> transaction.execute(ignored -> {
            var result = service.issueQr(event);
            issued.countDown(); await(release); return result;
        }));
        await(issued);
        var started = new CountDownLatch(1);
        var checkIn = executor.submit(() -> {
            started.countDown(); return service.checkIn(event, userId, old);
        });
        await(started);
        assertThatThrownBy(() -> checkIn.get(200, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
        release.countDown();
        var latest = reissue.get(10, TimeUnit.SECONDS);
        assertThatThrownBy(() -> checkIn.get(10, TimeUnit.SECONDS))
            .isInstanceOf(ExecutionException.class).hasCauseInstanceOf(BadRequestException.class);
        assertThat(latest.qrToken()).isNotEqualTo(old).hasSize(43);
        assertThat(latest.expiresAt()).isEqualTo(now.plusSeconds(30));
        assertThat(service.checkIn(event, userId, latest.qrToken()).status()).isEqualTo(PresenceStatus.PRESENT);
    }

    @Test
    void reissueAndManualUpdateWaitForCheckInWithoutLosingTheNote() throws Exception {
        long userId = user("가", Role.ROLE_MEMBER);
        long event = create(today);
        String old = service.issueQr(event).qrToken();
        var checked = new CountDownLatch(1);
        var checkIn = executor.submit(() -> transaction.execute(ignored -> {
            var result = service.checkIn(event, userId, old);
            checked.countDown(); await(release); return result;
        }));
        await(checked);
        var started = new CountDownLatch(2);
        var reissue = executor.submit(() -> { started.countDown(); return service.issueQr(event); });
        var update = executor.submit(() -> {
            started.countDown(); return service.update(event, userId, new AttendanceRequests.Update(null, "확인"));
        });
        await(started);
        assertThatThrownBy(() -> reissue.get(200, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
        assertThatThrownBy(() -> update.get(200, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
        release.countDown();
        var result = checkIn.get(10, TimeUnit.SECONDS);
        String latest = reissue.get(10, TimeUnit.SECONDS).qrToken();
        assertThat(update.get(10, TimeUnit.SECONDS).checkedInAt()).isEqualTo(result.checkedInAt());
        assertThatThrownBy(() -> service.checkIn(event, userId, old)).isInstanceOf(BadRequestException.class);
        assertThat(service.checkIn(event, userId, latest).checkedInAt()).isEqualTo(result.checkedInAt());
        assertThat(service.detail(event, null, "userName,asc").participants().content().get(0).note()).isEqualTo("확인");
    }

    @Test
    void tokenExpiryIsCheckedAfterWaitingForTheDatabaseLock() throws Exception {
        long userId = user("가", Role.ROLE_MEMBER);
        long event = create(today);
        String token = service.issueQr(event).qrToken();
        var locked = new CountDownLatch(1);
        var holder = executor.submit(() -> transaction.executeWithoutResult(ignored -> {
            attendances.findByIdForUpdate(event).orElseThrow();
            locked.countDown(); await(release);
        }));
        await(locked);
        var started = new CountDownLatch(1);
        var checkIn = executor.submit(() -> { started.countDown(); return service.checkIn(event, userId, token); });
        await(started);
        assertThatThrownBy(() -> checkIn.get(200, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
        when(clock.instant()).thenReturn(now.plusSeconds(30));
        release.countDown();
        holder.get(10, TimeUnit.SECONDS);
        assertThatThrownBy(() -> checkIn.get(10, TimeUnit.SECONDS))
            .isInstanceOf(ExecutionException.class).hasCauseInstanceOf(BadRequestException.class);
        assertThat(service.detail(event, null, "userName,asc").summary().presentCount()).isZero();
    }

    private long create(LocalDate date) {
        long id = service.create(new AttendanceRequests.Create("발표", date)).attendanceId();
        changeStatus(id, AttendanceStatus.ONGOING);
        return id;
    }

    private void changeStatus(long attendanceId, AttendanceStatus status) {
        service.changeStatus(attendanceId, new AttendanceRequests.ChangeStatus(status));
    }

    private long user(String name, Role role) {
        var user = new User();
        user.setName(name); user.setEmail(name + "@example.com");
        user.setProvider(AuthProvider.local); user.setRole(role);
        return transaction.execute(ignored -> users.save(user).getId());
    }

    private static void await(CountDownLatch latch) {
        try {
            assertThat(latch.await(10, TimeUnit.SECONDS)).isTrue();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new AssertionError(exception);
        }
    }
}
