package wap.web2.server.config.oracle;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Profile;

@Getter
@Setter
@Profile("oracle")
@ConfigurationProperties(prefix = "oracle.object-storage")
public class OracleObjectStorageProperties {

    private String namespace;
    private String bucketName;
    private String region;
    private String configPath;
    private String profile = "DEFAULT";

}
