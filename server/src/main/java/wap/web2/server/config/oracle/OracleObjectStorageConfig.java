package wap.web2.server.config.oracle;

import com.oracle.bmc.ConfigFileReader;
import com.oracle.bmc.auth.ConfigFileAuthenticationDetailsProvider;
import com.oracle.bmc.objectstorage.ObjectStorageClient;
import java.io.IOException;
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
    public ConfigFileAuthenticationDetailsProvider oracleAuthProvider() throws IOException {
        ConfigFileReader.ConfigFile configFile = ConfigFileReader.parse(
                properties.getConfigPath(),
                properties.getProfile()
        );
        return new ConfigFileAuthenticationDetailsProvider(configFile);
    }

    @Bean
    public ObjectStorageClient objectStorageClient(ConfigFileAuthenticationDetailsProvider authProvider) {
        ObjectStorageClient client = ObjectStorageClient.builder().build(authProvider);
        client.useRealmSpecificEndpointTemplate(true);
        return client;
    }

}
