package wap.web2.server.storage;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Repository
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class SharedImageRegistry {
    private final JdbcTemplate jdbc;

    // Held until the calling project transaction completes, including across app instances.
    public void lock() {
        jdbc.queryForObject("SELECT id FROM shared_image_storage_lock WHERE id = 1 FOR UPDATE", Integer.class);
    }

    // A locking read sees the latest registry even with MySQL REPEATABLE READ.
    public String find(String hash) {
        List<String> urls = jdbc.queryForList(
            "SELECT image_url FROM shared_image_storage WHERE sha256 = ? FOR UPDATE", String.class, hash);
        return urls.isEmpty() ? null : urls.get(0);
    }

    public void record(String hash, String url) {
        jdbc.update("INSERT INTO shared_image_storage (sha256, image_url) VALUES (?, ?) " +
            "ON DUPLICATE KEY UPDATE image_url = VALUES(image_url)", hash, url);
    }

    public boolean isReferenced(String url) {
        return jdbc.queryForObject(
            "SELECT (SELECT COUNT(*) FROM image WHERE image_file = ?) + " +
            "(SELECT COUNT(*) FROM project WHERE thumbnail = ?)", Long.class, url, url) > 0;
    }

    public void remove(String url) {
        jdbc.update("DELETE FROM shared_image_storage WHERE image_url = ?", url);
    }
}
