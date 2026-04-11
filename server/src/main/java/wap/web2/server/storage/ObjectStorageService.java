package wap.web2.server.storage;

import java.io.IOException;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface ObjectStorageService {

    List<String> uploadImages(
            String dirName,
            Integer projectYear,
            Integer semester,
            String projectName,
            String imageType,
            List<MultipartFile> imageFiles
    ) throws IOException;

    String uploadImage(
            String dirName,
            Integer projectYear,
            Integer semester,
            String projectName,
            String imageType,
            MultipartFile imageFile
    ) throws IOException;

    void deleteImage(String imageUrl);

}
