package wap.web2.server.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@EnableCaching
@Configuration
public class CacheConfig {

    /*
        사용될 api마다 개별 TTL을 설정한다.
        현재는 기본적으로 설정을 같게하여 서비스에 끼치는 영향을 파악하기위해 동일한 설정으로 한다.
     */
    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
                new CaffeineCache("projectList",
                        Caffeine.newBuilder()
                                .expireAfterWrite(60, TimeUnit.SECONDS)
                                .initialCapacity(100)
                                .maximumSize(1000)
                                .build()
                ),
                new CaffeineCache("voteResults",
                        Caffeine.newBuilder()
                                .expireAfterWrite(60, TimeUnit.SECONDS)
                                .initialCapacity(100)
                                .maximumSize(1000)
                                .build()
                )
        ));

        return manager;
    }

}
