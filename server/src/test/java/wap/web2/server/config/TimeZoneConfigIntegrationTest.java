package wap.web2.server.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.sql.Date;
import java.time.LocalDate;
import java.util.TimeZone;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.jdbc.core.JdbcTemplate;

@EnabledIfEnvironmentVariable(named = "ATTENDANCE_TEST_URL", matches = ".+")
class TimeZoneConfigIntegrationTest {
    @ParameterizedTest
    @ValueSource(strings = {"UTC", "America/Los_Angeles"})
    void initializesTimeZoneBeforeJdbcConnectionsCacheIt(String startupZone) {
        TimeZone original = TimeZone.getDefault();
        try {
            TimeZone.setDefault(TimeZone.getTimeZone(startupZone));
            new ApplicationContextRunner()
                .withUserConfiguration(TimeZoneConfig.class)
                .withBean("dataSource", HikariDataSource.class, () -> {
                    var config = new HikariConfig();
                    config.setJdbcUrl(System.getenv("ATTENDANCE_TEST_URL"));
                    config.setUsername("root");
                    config.setPassword("");
                    config.setMaximumPoolSize(1);
                    return new HikariDataSource(config);
                })
                // Reproduce a pool initialized before the configuration bean's @PostConstruct.
                .withInitializer(context -> context.addBeanFactoryPostProcessor(factory ->
                    factory.getBeanDefinition("timeZoneConfig").setDependsOn("dataSource")))
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(TimeZone.getDefault().getID()).isEqualTo("Asia/Seoul");
                    var jdbc = new JdbcTemplate(context.getBean(HikariDataSource.class));
                    jdbc.execute("CREATE TEMPORARY TABLE attendance_date_test (date DATE NOT NULL)");
                    LocalDate requested = LocalDate.of(2026, 10, 10);
                    // Hibernate binds LocalDate through java.sql.Date and PreparedStatement.setDate.
                    jdbc.update("INSERT INTO attendance_date_test (date) VALUES (?)", Date.valueOf(requested));
                    assertThat(jdbc.queryForObject("SELECT CAST(date AS CHAR) FROM attendance_date_test", String.class))
                        .isEqualTo("2026-10-10");
                    assertThat(jdbc.queryForObject("SELECT date FROM attendance_date_test", LocalDate.class))
                        .isEqualTo(requested);
                });
        } finally {
            TimeZone.setDefault(original);
        }
    }
}
