package wap.web2.server.config.azure;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Profile;

@Getter
@Setter
@Profile("azure")
@ConfigurationProperties(prefix = "azure.storage")
public class AzureStorageProperties {

    private String connectionString;
    private String containerName;
}
