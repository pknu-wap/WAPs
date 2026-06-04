package wap.web2.server.storage.impl;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.azure.storage.blob.options.BlobParallelUploadOptions;
import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import wap.web2.server.storage.ObjectStorageService;
import wap.web2.server.storage.StoragePathUtils;

@Service
@Profile("azure")
@RequiredArgsConstructor
public class AzureStorageService implements ObjectStorageService {

    private static final String AZURE_BLOB_HOST_SUFFIX = ".blob.core.windows.net";
    private static final long MAX_FILE_SIZE = 100L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp", "bmp");

    private final BlobContainerClient blobContainerClient;

    @Override
    public List<String> uploadImages(
            String dirName,
            Integer projectYear,
            Integer semester,
            String projectName,
            String imageType,
            List<MultipartFile> imageFiles
    ) throws IOException {
        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile imageFile : imageFiles) {
            imageUrls.add(uploadImage(dirName, projectYear, semester, projectName, imageType, imageFile));
        }
        return imageUrls;
    }

    @Override
    public String uploadImage(
            String dirName,
            Integer projectYear,
            Integer semester,
            String projectName,
            String imageType,
            MultipartFile imageFile
    ) throws IOException {
        validateImage(imageFile);

        String originalFileName = getOriginalFileName(imageFile);
        String blobName = StoragePathUtils.createTimestampFileName(
                dirName, projectYear, semester, projectName, imageType, originalFileName
        );

        BlobClient blobClient = blobContainerClient.getBlobClient(blobName);

        BlobHttpHeaders headers = new BlobHttpHeaders().setContentType(imageFile.getContentType());
        blobClient.uploadWithResponse(
                new BlobParallelUploadOptions(imageFile.getInputStream())
                        .setHeaders(headers),
                null,
                null
        );

        return blobClient.getBlobUrl();
    }

    @Override
    public void deleteImage(String imageUrl) {
        String blobName = extractBlobNameFromUrl(imageUrl);
        blobContainerClient.getBlobClient(blobName).delete();
    }

    private void validateImage(MultipartFile imageFile) {
        if (imageFile.isEmpty()) {
            throw new IllegalArgumentException("[ERROR] 파일이 비어있습니다.");
        }
        if (imageFile.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("[ERROR] 파일 용량이 제한(100MB)을 초과했습니다.");
        }
        String originalFilename = getOriginalFileName(imageFile);
        int dotIdx = originalFilename.lastIndexOf('.');
        if (dotIdx == -1) {
            throw new IllegalArgumentException("[ERROR] 파일 확장자가 없습니다: " + originalFilename);
        }
        String extension = originalFilename.substring(dotIdx + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("[ERROR] 지원하지 않는 이미지 확장자입니다: " + extension);
        }
    }

    private String extractBlobNameFromUrl(String url) {
        // URL format: https://{account}.blob.core.windows.net/{container}/{blobName}
        URI uri = URI.create(url);
        String host = uri.getHost();
        if (host == null || !host.endsWith(AZURE_BLOB_HOST_SUFFIX)) {
            throw new IllegalArgumentException("[ERROR] 올바르지 않은 Azure Blob URL: " + url);
        }

        String path = uri.getPath();
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("[ERROR] 올바르지 않은 Azure Blob URL: " + url);
        }

        String containerPrefix = "/" + blobContainerClient.getBlobContainerName() + "/";
        if (!path.startsWith(containerPrefix)) {
            throw new IllegalArgumentException("[ERROR] 올바르지 않은 Azure Blob URL: " + url);
        }

        return path.substring(containerPrefix.length());
    }

    private String getOriginalFileName(MultipartFile multipartFile) {
        String originalFilename = multipartFile.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("[ERROR] 파일 이름이 없습니다.");
        }
        return originalFilename;
    }
}
