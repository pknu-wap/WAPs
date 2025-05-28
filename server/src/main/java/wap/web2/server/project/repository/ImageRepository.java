package wap.web2.server.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wap.web2.server.project.entity.Image;

public interface ImageRepository extends JpaRepository<Image, Long> {
    void deleteByImageFile(String imageFile);
}
