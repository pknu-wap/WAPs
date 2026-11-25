package wap.web2.server.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.global.security.jwt.TokenProvider;
import wap.web2.server.member.entity.*;
import wap.web2.server.member.repository.UserRepository;

/** Fresh local MySQL only: Flyway must build a schema Hibernate can validate. */
@EnabledIfEnvironmentVariable(named = "PREMERGE_MYSQL_URL", matches = ".+")
@SpringBootTest(properties = {"SPRING_PROFILES_ACTIVE=test", "spring.jpa.hibernate.ddl-auto=validate"})
@AutoConfigureMockMvc
@Transactional
class PremergeMySqlApiTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired TokenProvider tokens;
    @Autowired ObjectMapper json;
    @Autowired DataSource dataSource;

    @DynamicPropertySource
    static void localTestDatabase(DynamicPropertyRegistry properties) {
        String url = System.getenv("PREMERGE_MYSQL_URL");
        URI address = URI.create(url.substring("jdbc:".length()));
        if (!"127.0.0.1".equals(address.getHost()) || !address.getPath().endsWith("_test")) {
            throw new IllegalStateException("Use a disposable loopback MySQL database ending in _test.");
        }
        properties.add("spring.datasource.url", () -> url);
        properties.add("spring.datasource.username", () -> "root");
        properties.add("spring.datasource.password", () -> "");
    }

    private User account(Role role, boolean completed) {
        User account = new User();
        account.setName("테스트");
        account.setEmail(UUID.randomUUID() + "@example.invalid");
        account.setProvider(AuthProvider.kakao);
        account.setProviderId(UUID.randomUUID().toString());
        account.setRole(role);
        account.setSignupCompleted(completed);
        return users.saveAndFlush(account);
    }

    private String bearer(User account) {
        UserPrincipal principal = UserPrincipal.create(account);
        return "Bearer " + tokens.createToken(new UsernamePasswordAuthenticationToken(
            principal, null, principal.getAuthorities()));
    }

    @Test
    void realJwtSignupAndProfileEditsPersistWithoutChangingPrivileges() throws Exception {
        User member = account(Role.ROLE_GUEST, false);
        String authorization = bearer(member);
        mvc.perform(post("/user/signup").header("Authorization", authorization).contentType("application/json")
            .content("{\"member\":true,\"name\":\"홍길동\",\"studentNumber\":\"26\",\"memberType\":\"NEW\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.signupCompleted").value(true));
        mvc.perform(patch("/user/registration").header("Authorization", authorization).contentType("application/json")
            .content("{\"member\":true,\"name\":\"수정이름\",\"studentNumber\":\"25\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.wapMember").value(true));
        mvc.perform(get("/user/me").header("Authorization", authorization))
            .andExpect(status().isOk()).andExpect(jsonPath("$.userName").value("수정이름"))
            .andExpect(jsonPath("$.studentNumber").value("25"))
            .andExpect(jsonPath("$.membershipLevel").value("NEW"));
        assertThat(users.findById(member.getId()).orElseThrow().getRole()).isEqualTo(Role.ROLE_MEMBER);
        mvc.perform(patch("/user/registration").contentType("application/json").content("{\"member\":false}"))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/admin/attendances").header("Authorization", authorization))
            .andExpect(status().isForbidden());
        try (var connection = dataSource.getConnection()) {
            assertThat(connection.getCatalog()).endsWith("_test");
        }
    }

    @Test
    void realJwtLateUpdateQrAndCountsRoundTripThroughMySql() throws Exception {
        User admin = account(Role.ROLE_ADMIN, true);
        User member = account(Role.ROLE_MEMBER, true);
        String authorization = bearer(admin);
        String date = LocalDate.now(ZoneId.of("Asia/Seoul")).toString();
        String created = mvc.perform(post("/admin/attendances").header("Authorization", authorization)
            .contentType("application/json").content("{\"title\":\"격리 출석 테스트\",\"date\":\"" + date + "\"}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = json.readTree(created).get("attendanceId").asLong();
        mvc.perform(patch("/admin/attendances/" + id).header("Authorization", authorization)
            .contentType("application/json").content("{\"status\":\"ONGOING\"}"))
            .andExpect(status().isOk());
        mvc.perform(patch("/admin/attendances/" + id + "/users/" + member.getId())
            .header("Authorization", authorization).contentType("application/json")
            .content("{\"status\":\"LATE\",\"note\":\"확인\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("LATE"));
        String qr = mvc.perform(post("/admin/attendances/" + id + "/qr").header("Authorization", authorization))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String token = json.readTree(qr).get("qrToken").asText();
        mvc.perform(post("/attendances/" + id + "/check-in").header("Authorization", bearer(member))
            .contentType("application/json").content("{\"qrToken\":\"" + token + "\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("LATE"));
        mvc.perform(get("/admin/attendances/" + id).header("Authorization", authorization))
            .andExpect(status().isOk()).andExpect(jsonPath("$.lateCount").value(1));
    }
}
