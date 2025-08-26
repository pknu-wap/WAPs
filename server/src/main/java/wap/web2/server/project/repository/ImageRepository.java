package wap.web2.server.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wap.web2.server.project.entity.Image;

public interface ImageRepository extends JpaRepository<Image, Long> {

    @Modifying
    @Query("DELETE FROM Image i WHERE i.imageFile = :imageFile")
    void deleteByImageFile(@Param("imageFile") String imageFile);

}
