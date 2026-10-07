package wap.web2.server.config;

import java.time.Clock;
import java.util.TimeZone;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeZoneConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    public static BeanFactoryPostProcessor initializeTimeZone() {
        // JDBC 연결이 기본 시간대를 캐시하기 전에 설정한다.
        return beanFactory -> TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
    }
}
