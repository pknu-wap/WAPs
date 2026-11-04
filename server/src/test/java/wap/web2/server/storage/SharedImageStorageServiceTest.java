package wap.web2.server.storage;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.TransactionTemplate;

@SpringJUnitConfig(SharedImageStorageServiceTest.Config.class)
class SharedImageStorageServiceTest {
    @Configuration
    @EnableTransactionManagement(proxyTargetClass = true)
    static class Config {
        @Bean DataSource dataSource() {
            return new DriverManagerDataSource("jdbc:h2:mem:shared-images;MODE=MySQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=5000", "sa", "");
        }
        @Bean JdbcTemplate jdbc(DataSource dataSource) { return new JdbcTemplate(dataSource); }
        @Bean PlatformTransactionManager transactionManager(DataSource dataSource) {
            return new DataSourceTransactionManager(dataSource);
        }
        @Bean SharedImageRegistry registry(JdbcTemplate jdbc) { return new SharedImageRegistry(jdbc); }
        @Bean CloudObjectStorageService cloud() { return mock(CloudObjectStorageService.class); }
        @Bean SharedImageStorageService storage(CloudObjectStorageService cloud, SharedImageRegistry registry,
                                                PlatformTransactionManager manager) {
            return new SharedImageStorageService(cloud, registry, manager);
        }
    }

    @Autowired SharedImageStorageService storage;
    @Autowired CloudObjectStorageService cloud;
    @Autowired JdbcTemplate jdbc;
    @Autowired PlatformTransactionManager manager;
    TransactionTemplate transaction;

    @BeforeEach
    void setup() throws IOException {
        reset(cloud);
        jdbc.execute("DROP ALL OBJECTS");
        jdbc.execute("CREATE TABLE shared_image_storage_lock (id INT PRIMARY KEY)");
        jdbc.update("INSERT INTO shared_image_storage_lock VALUES (1)");
        jdbc.execute("CREATE TABLE shared_image_storage (sha256 CHAR(64) PRIMARY KEY, image_url VARCHAR(2048))");
        jdbc.execute("CREATE TABLE image (image_file VARCHAR(2048))");
        jdbc.execute("CREATE TABLE project (thumbnail VARCHAR(2048))");
        transaction = new TransactionTemplate(manager);
        when(cloud.supports(anyString())).thenReturn(true);
        when(cloud.exists(anyString())).thenReturn(true);
        AtomicInteger uploaded = new AtomicInteger();
        when(cloud.uploadImage(anyString(), anyString(), anyString(), anyString(), any()))
            .thenAnswer(call -> "https://cloud/image-" + uploaded.incrementAndGet());
    }

    String upload(String name, byte[] data) {
        try {
            return storage.uploadImage("projects", "2026-02", "project", "images",
                new MockMultipartFile("image", name, "image/png", data));
        } catch (IOException failure) {
            throw new IllegalStateException(failure);
        }
    }

    String save(String name, byte[] data) {
        return transaction.execute(status -> {
            String url = upload(name, data);
            jdbc.update("INSERT INTO image VALUES (?)", url);
            return url;
        });
    }

    @Test
    void sameBytesWithDifferentNamesAndProjectsShareOneObject() throws Exception {
        String first = save("first.png", new byte[] {1, 2, 3});
        String second = save("renamed.png", new byte[] {1, 2, 3});
        assertThat(second).isEqualTo(first);
        verify(cloud, times(1)).uploadImage(anyString(), anyString(), anyString(), anyString(), any());
        assertThat(jdbc.queryForObject("SELECT sha256 FROM shared_image_storage", String.class))
            .isEqualTo("039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81");
    }

    @Test
    void sameFilenameWithDifferentBytesStoresSeparateObjects() {
        assertThat(save("same.png", new byte[] {1})).isNotEqualTo(save("same.png", new byte[] {2}));
    }

    @Test
    void thumbnailAndImagesReuseObjectAndLastReferenceControlsDeletion() throws Exception {
        String url = save("image.png", new byte[] {1});
        transaction.executeWithoutResult(status -> {
            try {
                String thumbnail = storage.uploadImage("projects", "2025-01", "another", "thumbnail",
                    new MockMultipartFile("thumbnail", "renamed.jpg", "image/jpeg", new byte[] {1}));
                assertThat(thumbnail).isEqualTo(url);
                jdbc.update("INSERT INTO project VALUES (?)", thumbnail);
            } catch (IOException failure) { throw new IllegalStateException(failure); }
            jdbc.update("DELETE FROM image");
            storage.deleteImage(url);
        });
        verify(cloud, never()).deleteImage(anyString());
        transaction.executeWithoutResult(status -> {
            jdbc.update("DELETE FROM project");
            storage.deleteImage(url);
        });
        verify(cloud).deleteImage(url);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shared_image_storage", Integer.class)).isZero();
    }

    @Test
    void rollbackOfRemovalKeepsReferencedObject() {
        String url = save("image.png", new byte[] {1});
        transaction.executeWithoutResult(status -> {
            jdbc.update("DELETE FROM image");
            storage.deleteImage(url);
            status.setRollbackOnly();
        });
        verify(cloud, never()).deleteImage(anyString());
    }

    @Test
    void failedProjectSaveCleansNewUploadButKeepsPreviouslySharedObject() {
        String existing = save("image.png", new byte[] {1});
        transaction.executeWithoutResult(status -> {
            assertThat(upload("renamed.png", new byte[] {1})).isEqualTo(existing);
            String unused = upload("unused.png", new byte[] {2});
            jdbc.update("INSERT INTO image VALUES (?)", unused);
            status.setRollbackOnly();
        });
        verify(cloud, never()).deleteImage(existing);
        verify(cloud).deleteImage("https://cloud/image-2");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shared_image_storage", Integer.class)).isEqualTo(1);
    }

    @Test
    void missingCloudObjectIsUploadedAgain() {
        String missing = save("image.png", new byte[] {1});
        when(cloud.exists(missing)).thenReturn(false);
        assertThat(save("image.png", new byte[] {1})).isNotEqualTo(missing);
    }

    @Test
    void failedCloudUploadDoesNotCreateRegistryEntry() throws Exception {
        when(cloud.uploadImage(anyString(), anyString(), anyString(), anyString(), any()))
            .thenThrow(new IOException("upload failed"));
        assertThatThrownBy(() -> save("image.png", new byte[] {1})).hasCauseInstanceOf(IOException.class);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shared_image_storage", Integer.class)).isZero();
    }

    @Test
    void failedCleanupKeepsRegistryAndDoesNotFailCommittedProject() {
        String url = save("image.png", new byte[] {1});
        doThrow(new IllegalStateException("storage offline")).when(cloud).deleteImage(url);
        transaction.executeWithoutResult(status -> {
            jdbc.update("DELETE FROM image");
            storage.deleteImage(url);
        });
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM image", Integer.class)).isZero();
        assertThat(save("image.png", new byte[] {1})).isEqualTo(url);
    }

    @Test
    void concurrentUploadsOnlyStoreOnce() throws Exception {
        var executor = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            var first = executor.submit(() -> { start.await(); return save("one.png", new byte[] {1}); });
            var second = executor.submit(() -> { start.await(); return save("two.png", new byte[] {1}); });
            start.countDown();
            assertThat(first.get(10, TimeUnit.SECONDS)).isEqualTo(second.get(10, TimeUnit.SECONDS));
            verify(cloud, times(1)).uploadImage(anyString(), anyString(), anyString(), anyString(), any());
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void duplicateImagesInOneRequestShareOneObject() throws Exception {
        transaction.executeWithoutResult(status -> {
            try {
                var files = List.<org.springframework.web.multipart.MultipartFile>of(
                    new MockMultipartFile("image", "first.png", "image/png", new byte[] {1}),
                    new MockMultipartFile("image", "second.png", "image/png", new byte[] {1}));
                var urls = storage.uploadImages("projects", "2026-02", "project", "images", files);
                assertThat(urls.get(0)).isEqualTo(urls.get(1));
                urls.forEach(url -> jdbc.update("INSERT INTO image VALUES (?)", url));
            } catch (IOException failure) { throw new IllegalStateException(failure); }
        });
        verify(cloud, times(1)).uploadImage(anyString(), anyString(), anyString(), anyString(), any());
    }

    @Test
    void concurrentLastRemovalAndReuseNeverDeleteTheNewReference() throws Exception {
        String oldUrl = save("old.png", new byte[] {1});
        var executor = Executors.newFixedThreadPool(2);
        CountDownLatch removing = new CountDownLatch(1);
        CountDownLatch uploading = new CountDownLatch(1);
        try {
            var removal = executor.submit(() -> transaction.executeWithoutResult(status -> {
                jdbc.update("DELETE FROM image");
                storage.deleteImage(oldUrl);
                removing.countDown();
                try {
                    assertThat(uploading.await(5, TimeUnit.SECONDS)).isTrue();
                } catch (InterruptedException failure) { throw new IllegalStateException(failure); }
            }));
            var upload = executor.submit(() -> {
                assertThat(removing.await(5, TimeUnit.SECONDS)).isTrue();
                uploading.countDown();
                return save("new.png", new byte[] {1});
            });
            removal.get(10, TimeUnit.SECONDS);
            String url = upload.get(10, TimeUnit.SECONDS);
            verify(cloud, never()).deleteImage(url);
            assertThat(jdbc.queryForObject("SELECT image_url FROM shared_image_storage", String.class)).isEqualTo(url);
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void legacyFilesAreNotBackfilled() {
        jdbc.update("INSERT INTO image VALUES ('https://cloud/legacy')");
        save("image.png", new byte[] {1});
        assertThat(jdbc.queryForList("SELECT image_url FROM shared_image_storage", String.class))
            .doesNotContain("https://cloud/legacy");
        verify(cloud, never()).deleteImage("https://cloud/legacy");
    }
}
