package wap.web2.server.storage;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@Primary
@Profile("azure | aws | oracle")
@Transactional(rollbackFor = IOException.class)
public class SharedImageStorageService implements ObjectStorageService {
    private final CloudObjectStorageService storage;
    private final SharedImageRegistry registry;
    private final TransactionTemplate cleanupTransaction;

    public SharedImageStorageService(CloudObjectStorageService storage, SharedImageRegistry registry,
                                    PlatformTransactionManager transactionManager) {
        this.storage = storage;
        this.registry = registry;
        cleanupTransaction = new TransactionTemplate(transactionManager);
        cleanupTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        cleanupTransaction.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
    }

    @Override
    public String uploadImage(String dirName, String semester, String projectName, String imageType,
                              MultipartFile file) throws IOException {
        String hash = sha256(file);
        registry.lock();
        String url = registry.find(hash);
        if (url == null || !storage.supports(url) || !storage.exists(url)) {
            url = storage.uploadImage(dirName, semester, projectName, imageType, file);
            try {
                registry.record(hash, url);
            } catch (RuntimeException failure) {
                try {
                    storage.deleteImage(url);
                } catch (RuntimeException cleanupFailure) {
                    failure.addSuppressed(cleanupFailure);
                }
                throw failure;
            }
        }
        cleanAfterCompletion(url);
        return url;
    }

    @Override
    public List<String> uploadImages(String dirName, String semester, String projectName,
                                     String imageType, List<MultipartFile> files) throws IOException {
        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            urls.add(uploadImage(dirName, semester, projectName, imageType, file));
        }
        return urls;
    }

    @Override
    public boolean supports(String url) {
        return storage.supports(url);
    }

    @Override
    public void deleteImage(String url) {
        registry.lock();
        cleanAfterCompletion(url);
    }

    private void cleanAfterCompletion(String url) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                try {
                    cleanupTransaction.executeWithoutResult(transaction -> {
                        registry.lock();
                        // Legacy files retain their previous removal behavior, but never delete
                        // a file still referenced by a committed project or thumbnail.
                        if (!registry.isReferenced(url) && storage.supports(url)) {
                            storage.deleteImage(url);
                            registry.remove(url);
                        }
                    });
                } catch (RuntimeException failure) {
                    // Keep metadata on failure so a later upload can reuse the object.
                    log.warn("Image cleanup failed for {}", url, failure);
                }
            }
        });
    }

    private String sha256(MultipartFile file) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream stream = file.getInputStream()) {
                byte[] buffer = new byte[8192];
                int count;
                while ((count = stream.read(buffer)) != -1) digest.update(buffer, 0, count);
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable", impossible);
        }
    }
}
