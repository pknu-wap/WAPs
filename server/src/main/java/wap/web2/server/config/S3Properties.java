package wap.web2.server.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "aws")
public class S3Properties {

    private String accessKeyId;
    private String secretKey;
    private S3 s3 = new S3();

    @Getter
    @Setter
    public static class S3 {
        private String region;
        private String bucketName;
    }

}
