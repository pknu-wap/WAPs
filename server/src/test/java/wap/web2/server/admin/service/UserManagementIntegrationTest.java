package wap.web2.server.admin.service;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.*;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.*;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.transaction.support.TransactionTemplate;
import wap.web2.server.admin.dto.request.UserAttributesRequest;
import wap.web2.server.exception.*;
import wap.web2.server.member.entity.*;
import wap.web2.server.member.repository.UserRepository;

class UserManagementIntegrationTest {
    private LocalContainerEntityManagerFactoryBean factory;
    private UserRepository users;
    private UserManagementService service;
    private TransactionTemplate transaction;
    private JdbcTemplate jdbc;

    @BeforeEach
    void setup() {
        var source = new DriverManagerDataSource("jdbc:h2:mem:" + java.util.UUID.randomUUID()
            + ";MODE=MySQL;NON_KEYWORDS=USER;DB_CLOSE_DELAY=-1", "sa", "");
        factory = new LocalContainerEntityManagerFactoryBean();
        factory.setDataSource(source);
        factory.setPackagesToScan("wap.web2.server");
        factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        factory.setJpaPropertyMap(Map.of("hibernate.hbm2ddl.auto", "create-drop",
            "hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy"));
        factory.afterPropertiesSet();
        var em = SharedEntityManagerCreator.createSharedEntityManager(factory.getObject());
        users = new JpaRepositoryFactory(em).getRepository(UserRepository.class);
        var manager = new JpaTransactionManager(factory.getObject());
        transaction = new TransactionTemplate(manager);
        jdbc = new JdbcTemplate(source);
        var proxy = new ProxyFactory(new UserManagementService(users, jdbc));
        proxy.addAdvice(new TransactionInterceptor(manager, new AnnotationTransactionAttributeSource()));
        service = (UserManagementService) proxy.getProxy();
    }

    @AfterEach
    void close() { if (factory != null) factory.destroy(); }

    private long member(String name) {
        return transaction.execute(status -> {
            var user = new User();
            user.setName(name);
            user.setEmail(name + "@example.invalid");
            user.setProvider(AuthProvider.local);
            user.setRole(Role.ROLE_MEMBER);
            user.setMembershipLevel(MembershipLevel.NEW);
            return users.saveAndFlush(user).getId();
        });
    }

    @Test
    void combinedAndSingleUpdatesPersistAndCanBeReadWithFilters() {
        long first = member("first"), second = member("second");
        var result = service.update(new UserAttributesRequest(List.of(second, first), Role.ROLE_ADMIN, "REGULAR"));
        assertThat(result).allSatisfy(user -> {
            assertThat(user.role()).isEqualTo(Role.ROLE_ADMIN);
            assertThat(user.memberType()).isEqualTo("REGULAR");
        });
        service.update(new UserAttributesRequest(List.of(first), null, "UNDECIDED"));
        service.update(new UserAttributesRequest(List.of(second), Role.ROLE_GUEST, null));
        transaction.executeWithoutResult(status -> {
            assertThat(users.findById(first).orElseThrow().getMembershipLevel()).isEqualTo(MembershipLevel.NONE);
            assertThat(users.findById(first).orElseThrow().getRole()).isEqualTo(Role.ROLE_ADMIN);
            assertThat(users.findById(second).orElseThrow().getMembershipLevel()).isEqualTo(MembershipLevel.REGULAR);
            assertThat(users.findUserByOffset(12, 0, Role.ROLE_ADMIN, MembershipLevel.NONE))
                .extracting(User::getId).containsExactly(first);
        });
    }

    @Test
    void filteredPagesContainEveryMatchingUserExactlyOnceIncludingDuplicateNames() {
        var expectedAll = new java.util.ArrayList<Long>();
        var expectedAdmins = new java.util.ArrayList<Long>();
        var expectedRegularAdmins = new java.util.ArrayList<Long>();
        // All names tie, and role/level matches are interleaved across page boundaries.
        for (int i = 0; i < 29; i++) {
            long id = member("account" + i);
            boolean admin = i % 2 == 0;
            boolean regular = i % 3 == 0;
            transaction.executeWithoutResult(status -> {
                var user = users.findById(id).orElseThrow();
                user.setName("동명이인");
                user.setRole(admin ? Role.ROLE_ADMIN : Role.ROLE_MEMBER);
                user.setMembershipLevel(regular ? MembershipLevel.REGULAR : MembershipLevel.NEW);
            });
            expectedAll.add(id);
            if (admin) expectedAdmins.add(id);
            if (admin && regular) expectedRegularAdmins.add(id);
        }
        assertPages(null, null, expectedAll);
        assertPages(Role.ROLE_ADMIN, null, expectedAdmins);
        assertPages(Role.ROLE_ADMIN, MembershipLevel.REGULAR, expectedRegularAdmins);
        assertPages(Role.ROLE_GUEST, null, List.of());
    }

    private void assertPages(Role role, MembershipLevel level, List<Long> expected) {
        var service = new UserRoleService(users);
        for (int size : List.of(1, 5, 12)) {
            var actual = new java.util.ArrayList<Long>();
            int pageCount = Math.max(1, (expected.size() + size - 1) / size);
            for (int page = 0; page < pageCount; page++) {
                var result = service.getUsersForAdmin(size, page, role, level);
                assertThat(result.hasNext()).isEqualTo((page + 1) * size < expected.size());
                actual.addAll(result.content().stream().map(user -> user.id()).toList());
            }
            assertThat(actual).containsExactlyElementsOf(expected).doesNotHaveDuplicates();
            var beyondLastPage = service.getUsersForAdmin(size, pageCount, role, level);
            assertThat(beyondLastPage.content()).isEmpty();
            assertThat(beyondLastPage.hasNext()).isFalse();
        }
    }

    @Test
    void missingOrDuplicateTargetsDoNotPartiallyUpdateOrDelete() {
        long id = member("first");
        assertThatThrownBy(() -> service.update(new UserAttributesRequest(List.of(id, Long.MAX_VALUE), Role.ROLE_ADMIN, "REGULAR")))
            .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.delete(List.of(id, Long.MAX_VALUE))).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.update(new UserAttributesRequest(List.of(id, id), Role.ROLE_ADMIN, null)))
            .isInstanceOf(BadRequestException.class);
        assertThat(users.findById(id).orElseThrow().getRole()).isEqualTo(Role.ROLE_MEMBER);
    }

    @Test
    void deletionRemovesAccountsAndRefreshTokens() {
        long id = member("first");
        jdbc.update("INSERT INTO refresh_token (user_id, token, expiry_date) VALUES (?, 'token', CURRENT_TIMESTAMP)", id);
        service.delete(List.of(id));
        assertThat(users.findById(id)).isEmpty();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM refresh_token", Long.class)).isZero();
    }

    @Test
    void linkedContentRejectsWholeDeletionAndRestoresTokens() {
        long first = member("first"), second = member("second");
        jdbc.update("INSERT INTO refresh_token (user_id, token, expiry_date) VALUES (?, 'token', CURRENT_TIMESTAMP)", first);
        jdbc.update("INSERT INTO project (title, user_id) VALUES ('shared work', ?)", second);
        assertThatThrownBy(() -> service.delete(List.of(first, second))).isInstanceOf(ConflictException.class);
        assertThat(users.findAllById(List.of(first, second))).hasSize(2);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM refresh_token", Long.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT title FROM project", String.class)).isEqualTo("shared work");
    }

    @Test
    void databaseFailureRollsBackAllAttributeUpdates() {
        long first = member("first"), second = member("second");
        jdbc.execute("ALTER TABLE `user` ADD CONSTRAINT reject_second_admin CHECK (name <> 'second' OR role <> 'ROLE_ADMIN')");
        assertThatThrownBy(() -> service.update(new UserAttributesRequest(List.of(first, second), Role.ROLE_ADMIN, "REGULAR")))
            .isInstanceOf(RuntimeException.class);
        assertThat(users.findAllById(List.of(first, second))).allSatisfy(user -> {
            assertThat(user.getRole()).isEqualTo(Role.ROLE_MEMBER);
            assertThat(user.getMembershipLevel()).isEqualTo(MembershipLevel.NEW);
        });
    }

    @Test
    void httpContractSavesReloadsAndDeletesUsingFrontendPayloads() throws Exception {
        long id = member("first");
        var mvc = org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(
            new wap.web2.server.admin.controller.AdminUserController(new UserRoleService(users), service))
            .setControllerAdvice(new GlobalExceptionHandler()).build();
        mvc.perform(patch("/admin/role/attributes").contentType("application/json")
            .content("{\"userIds\":[" + id + "],\"role\":\"ROLE_ADMIN\",\"memberType\":\"UNDECIDED\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].role").value("ROLE_ADMIN"))
            .andExpect(jsonPath("$[0].memberType").value("UNDECIDED"))
            .andExpect(jsonPath("$[0].membershipLevel").value("NONE"));
        mvc.perform(get("/admin/role").param("page", "0").param("size", "12")
            .param("role", "ROLE_ADMIN").param("memberType", "UNDECIDED").param("membershipLevel", "NONE"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(id))
            .andExpect(jsonPath("$.content[0].memberType").value("UNDECIDED"));
        mvc.perform(delete("/admin/role/users").contentType("application/json")
            .content("{\"userIds\":[" + id + "]}"))
            .andExpect(status().isNoContent());
        mvc.perform(get("/admin/role").param("page", "0").param("size", "12"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content").isEmpty());
    }
}
