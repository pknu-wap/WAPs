package wap.web2.server.config.oracle;

import static org.assertj.core.api.Assertions.assertThat;

import com.oracle.bmc.auth.SimpleAuthenticationDetailsProvider;
import com.oracle.bmc.objectstorage.ObjectStorageClient;
import java.nio.charset.StandardCharsets;
import java.security.KeyPairGenerator;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.core.io.ClassPathResource;

class OracleObjectStorageConfigTest {

    @Test
    void createsClientFromEnvironmentCredentialsWithoutConfigFile() throws Exception {
        var keyGenerator = KeyPairGenerator.getInstance("RSA");
        keyGenerator.initialize(2048);
        String privateKey = "-----BEGIN PRIVATE KEY-----\n" +
            Base64.getMimeEncoder(64, new byte[] {'\n'}).encodeToString(
                keyGenerator.generateKeyPair().getPrivate().getEncoded()
            ) + "\n-----END PRIVATE KEY-----";
        var oracleConfig = new YamlPropertySourceLoader().load(
            "oracle", new ClassPathResource("application-oracle.yml")
        ).get(0);

        new ApplicationContextRunner()
            .withInitializer(context ->
                context.getEnvironment().getPropertySources().addLast(oracleConfig)
            )
            .withPropertyValues(
                "spring.profiles.active=oracle",
                "OCI_USER=ocid1.user.oc1..test",
                "OCI_FINGERPRINT=42:d2:11:ce:9e:68:d0:aa:52:29:test",
                "OCI_TENANCY=ocid1.tenancy.oc1..test",
                "OCI_REGION=ap-singapore-2",
                "OCI_NAMESPACE=test",
                "OCI_BUCKET_NAME=waps-bucket",
                "OCI_KEY=" + privateKey
            )
            .withUserConfiguration(OracleObjectStorageConfig.class)
            .run(context -> {
                assertThat(context).hasNotFailed();
                var provider = context.getBean(SimpleAuthenticationDetailsProvider.class);
                assertThat(provider.getUserId()).isEqualTo("ocid1.user.oc1..test");
                assertThat(provider.getFingerprint()).isEqualTo("42:d2:11:ce:9e:68:d0:aa:52:29:test");
                assertThat(provider.getTenantId()).isEqualTo("ocid1.tenancy.oc1..test");
                assertThat(provider.getRegion().getRegionId()).isEqualTo("ap-singapore-2");
                for (int read = 0; read < 2; read++) {
                    try (var stream = provider.getPrivateKey()) {
                        assertThat(new String(stream.readAllBytes(), StandardCharsets.UTF_8))
                            .isEqualTo(privateKey);
                    }
                }
                assertThat(context.getBean(ObjectStorageClient.class).getEndpoint())
                    .contains("objectstorage.ap-singapore-2.");
            });
    }
}
