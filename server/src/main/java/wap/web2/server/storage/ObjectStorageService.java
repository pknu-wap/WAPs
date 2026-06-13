package wap.web2.server.storage;

import java.io.IOException;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface ObjectStorageService {

    List<String> uploadImages(
            String dirName,
            String semester,
            String projectName,
            String imageType,
            List<MultipartFile> imageFiles
    ) throws IOException;

    String uploadImage(
            String dirName,
            String semester,
            String projectName,
            String imageType,
            MultipartFile imageFile
    ) throws IOException;

    boolean supports(String imageUrl);

    void deleteImage(String imageUrl);

}
