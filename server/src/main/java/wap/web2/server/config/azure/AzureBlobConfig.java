package wap.web2.server.config.azure;

import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(AzureStorageProperties.class)
@RequiredArgsConstructor
public class AzureBlobConfig {

    private final AzureStorageProperties properties;

    @Bean
    public BlobServiceClient blobServiceClient() {
        if (properties.getConnectionString() == null || properties.getConnectionString().isBlank()) {
            return null;
        }
        return new BlobServiceClientBuilder()
                .connectionString(properties.getConnectionString())
                .buildClient();
    }

    @Bean
    public BlobContainerClient blobContainerClient(
            ObjectProvider<BlobServiceClient> blobServiceClientProvider
    ) {
        BlobServiceClient blobServiceClient = blobServiceClientProvider.getIfAvailable();
        if (blobServiceClient == null) {
            return null;
        }
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(
                properties.getContainerName()
        );
        containerClient.createIfNotExists();
        return containerClient;
    }
}
