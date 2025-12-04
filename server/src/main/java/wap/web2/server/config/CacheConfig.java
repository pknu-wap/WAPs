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


    // 사용될 api마다 개별 정책(TTL, Cap)을 설정한다.
    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
                new CaffeineCache("projectList",
                        Caffeine.newBuilder()
                                .expireAfterWrite(30, TimeUnit.MINUTES)
                                .initialCapacity(4)
                                .maximumSize(20)
                                .build()
                ),
                new CaffeineCache("voteResults",
                        Caffeine.newBuilder()
                                .expireAfterWrite(60, TimeUnit.MINUTES)
                                .initialCapacity(4)
                                .maximumSize(20)
                                .build()
                )
        ));

        return manager;
    }

}
