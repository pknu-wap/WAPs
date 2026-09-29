package wap.web2.server.config.oracle;

import com.oracle.bmc.Region;
import com.oracle.bmc.auth.SimpleAuthenticationDetailsProvider;
import com.oracle.bmc.objectstorage.ObjectStorageClient;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("oracle")
@RequiredArgsConstructor
@EnableConfigurationProperties(OracleObjectStorageProperties.class)
public class OracleObjectStorageConfig {

    private final OracleObjectStorageProperties properties;

    @Bean
    public SimpleAuthenticationDetailsProvider oracleAuthProvider() {
        byte[] privateKey = properties.getKey().getBytes(StandardCharsets.UTF_8);
        return SimpleAuthenticationDetailsProvider.builder()
            .userId(properties.getUser())
            .fingerprint(properties.getFingerprint())
            .tenantId(properties.getTenancy())
            .region(Region.fromRegionId(properties.getRegion()))
            .privateKeySupplier(() -> new ByteArrayInputStream(privateKey))
            .build();
    }

    @Bean
    public ObjectStorageClient objectStorageClient(
        SimpleAuthenticationDetailsProvider authProvider
    ) {
        ObjectStorageClient client = ObjectStorageClient.builder().build(authProvider);
        client.useRealmSpecificEndpointTemplate(true);
        return client;
    }
}
