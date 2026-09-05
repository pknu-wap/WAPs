package wap.web2.server.storage.impl;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import wap.web2.server.storage.ObjectStorageService;

@Service
@Profile("!azure & !aws & !oracle")
public class NoOpObjectStorageService implements ObjectStorageService {

    @Override
    public List<String> uploadImages(
        String dirName,
        String semester,
        String projectName,
        String imageType,
        List<MultipartFile> imageFiles
    ) throws IOException {
        return Collections.emptyList();
    }

    @Override
    public String uploadImage(
        String dirName,
        String semester,
        String projectName,
        String imageType,
        MultipartFile imageFile
    ) throws IOException {
        return "";
    }

    @Override
    public boolean supports(String imageUrl) {
        return false;
    }

    @Override
    public void deleteImage(String imageUrl) {}
}
