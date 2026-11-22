package wap.web2.server.vote.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.mock;

import jakarta.persistence.EntityManager;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.*;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.transaction.support.TransactionTemplate;
import wap.web2.server.admin.entity.*;
import wap.web2.server.admin.repository.VoteMetaRepository;
import wap.web2.server.admin.service.AdminVoteService;
import wap.web2.server.exception.*;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.vote.dto.VoteRequest;
import wap.web2.server.vote.repository.BallotRepository;

/** Isolated in-memory database; never connects to application or environment databases. */
class VoteIntegrationTest {
    private LocalContainerEntityManagerFactoryBean factory;
    private TransactionTemplate transaction;
    private VoteMetaRepository metas;
    private BallotRepository ballots;
    private VoteService voting;
    private AdminVoteService admin;
    private List<Long> projectIds;
    private final ExecutorService executor = Executors.newFixedThreadPool(2);
    private final CountDownLatch release = new CountDownLatch(1);
    private static final String TERM = "2026-02";
    private final UserPrincipal principal = new UserPrincipal(5L, "voter@test", "",
        List.of(new SimpleGrantedAuthority("ROLE_MEMBER")));

    @BeforeEach void setup() {
        factory = new LocalContainerEntityManagerFactoryBean();
        factory.setDataSource(new DriverManagerDataSource(
            "jdbc:h2:mem:vote_" + UUID.randomUUID() + ";MODE=MySQL;NON_KEYWORDS=USER;DB_CLOSE_DELAY=-1", "sa", ""));
        factory.setPackagesToScan("wap.web2.server");
        factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        factory.setJpaPropertyMap(Map.of("hibernate.hbm2ddl.auto", "create-drop",
            "hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy"));
        factory.afterPropertiesSet();
        EntityManager em = SharedEntityManagerCreator.createSharedEntityManager(factory.getObject());
        var repositories = new JpaRepositoryFactory(em);
        metas = repositories.getRepository(VoteMetaRepository.class);
        ballots = repositories.getRepository(BallotRepository.class);
        var projects = repositories.getRepository(ProjectRepository.class);
        var manager = new JpaTransactionManager(factory.getObject());
        transaction = new TransactionTemplate(manager);
        voting = transactional(new VoteService(mock(UserRepository.class), ballots, metas), manager);
        admin = transactional(new AdminVoteService(metas, projects, ballots), manager);
        projectIds = transaction.execute(ignored -> {
            var ids = new ArrayList<Long>();
            for (int i = 0; i < 3; i++) {
                ids.add(projects.save(Project.builder().semester(TERM).title("Project " + i).build()).getProjectId());
            }
            metas.save(VoteMeta.of(TERM, 2L, new HashSet<>(ids)));
            return ids;
        });
    }

    @SuppressWarnings("unchecked")
    private <T> T transactional(T target, JpaTransactionManager manager) {
        var proxy = new ProxyFactory(target);
        proxy.addAdvice(new TransactionInterceptor(manager, new AnnotationTransactionAttributeSource()));
        return (T) proxy.getProxy();
    }

    @AfterEach void cleanup() throws InterruptedException {
        release.countDown();
        executor.shutdownNow();
        executor.awaitTermination(10, TimeUnit.SECONDS);
        if (factory != null) factory.destroy();
    }

    private void submit() { voting.vote(principal, new VoteRequest(projectIds, TERM)); }

    private static void await(CountDownLatch latch) {
        try { assertThat(latch.await(10, TimeUnit.SECONDS)).isTrue(); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); throw new AssertionError(e); }
    }

    @Test void concurrentRequestsCreateOnlyOneSetOfBallots() throws Exception {
        var start = new CountDownLatch(1);
        Callable<Boolean> submit = () -> {
            await(start);
            try { submit(); return true; }
            catch (ConflictException expected) { return false; }
        };
        var first = executor.submit(submit);
        var second = executor.submit(submit);
        start.countDown();
        assertThat(List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS)))
            .containsExactlyInAnyOrder(true, false);
        assertThat(ballots.countBallotsBySemesterAndUserId(TERM, 5L)).isEqualTo(3);
    }

    @Test void closingWaitsForVoteCommitAndReopeningPreservesVotes() throws Exception {
        var submitted = new CountDownLatch(1);
        var submission = executor.submit(() -> transaction.executeWithoutResult(ignored -> {
            submit(); submitted.countDown(); await(release);
        }));
        await(submitted);
        var closing = new CountDownLatch(1);
        var close = executor.submit(() -> { closing.countDown(); admin.closeVote(TERM, 2L); });
        await(closing);
        assertThatThrownBy(() -> close.get(200, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
        release.countDown();
        submission.get(10, TimeUnit.SECONDS); close.get(10, TimeUnit.SECONDS);
        admin.changeResultStatus(TERM, true);
        assertThat(voting.getVoteResults(TERM).results()).hasSize(3);
        admin.reopenVote(TERM);
        assertThatThrownBy(this::submit).isInstanceOf(ConflictException.class);
        assertThat(ballots.countBallotsBySemesterAndUserId(TERM, 5L)).isEqualTo(3);
        assertThatThrownBy(() -> voting.getVoteResults(TERM)).isInstanceOf(ForbiddenException.class);
    }

    @Test void submissionWaitsForCloseAndThenRejects() throws Exception {
        var closed = new CountDownLatch(1);
        var close = executor.submit(() -> transaction.executeWithoutResult(ignored -> {
            admin.closeVote(TERM, 2L); closed.countDown(); await(release);
        }));
        await(closed);
        var submitting = new CountDownLatch(1);
        var submission = executor.submit(() -> { submitting.countDown(); submit(); });
        await(submitting);
        assertThatThrownBy(() -> submission.get(200, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
        release.countDown();
        close.get(10, TimeUnit.SECONDS);
        assertThatThrownBy(() -> submission.get(10, TimeUnit.SECONDS))
            .isInstanceOf(ExecutionException.class).hasCauseInstanceOf(ConflictException.class);
        assertThat(ballots.countBallotsBySemesterAndUserId(TERM, 5L)).isZero();
    }

    @Test void resultsIncludeZeroVotesAndMissingSemesterReturnsNotFound() {
        admin.closeVote(TERM, 2L); admin.changeResultStatus(TERM, true);
        assertThat(ballots.countVotesByProject(TERM)).hasSize(3)
            .allSatisfy(result -> assertThat(result.getVoteCount()).isZero());
        assertThatThrownBy(() -> voting.getVoteResults("2025-01")).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> admin.getVoteResult("2025-01")).isInstanceOf(ResourceNotFoundException.class);
    }
}
