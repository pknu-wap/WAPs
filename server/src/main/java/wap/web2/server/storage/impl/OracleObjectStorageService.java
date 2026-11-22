package wap.web2.server.storage.impl;

import com.oracle.bmc.objectstorage.ObjectStorageClient;
import com.oracle.bmc.objectstorage.requests.DeleteObjectRequest;
import com.oracle.bmc.objectstorage.requests.PutObjectRequest;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import wap.web2.server.config.oracle.OracleObjectStorageProperties;
import wap.web2.server.storage.CloudObjectStorageService;
import wap.web2.server.storage.StoragePathUtils;

@Service
@Profile("oracle")
@RequiredArgsConstructor
public class OracleObjectStorageService implements CloudObjectStorageService {

    private static final String ORACLE_OBJECT_PATH_SEGMENT = "/o/";

    private final ObjectStorageClient objectStorageClient;
    private final OracleObjectStorageProperties properties;

    @Override
    public List<String> uploadImages(
        String dirName,
        String semester,
        String projectName,
        String imageType,
        List<MultipartFile> imageFiles
    ) throws IOException {
        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile imageFile : imageFiles) {
            imageUrls.add(uploadImage(dirName, semester, projectName, imageType, imageFile));
        }
        return imageUrls;
    }

    @Override
    public String uploadImage(
        String dirName,
        String semester,
        String projectName,
        String imageType,
        MultipartFile imageFile
    ) throws IOException {
        String originalFileName = getOriginalFileName(imageFile);
        String objectName = StoragePathUtils.createUniqueFileName(
            dirName,
            semester,
            projectName,
            imageType,
            originalFileName
        );

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
            .namespaceName(properties.getNamespace())
            .bucketName(properties.getBucketName())
            .objectName(objectName)
            .contentLength(imageFile.getSize())
            .contentType(imageFile.getContentType())
            .putObjectBody(imageFile.getInputStream())
            .build();
        objectStorageClient.putObject(putObjectRequest);

        return buildPublicObjectUrl(objectName);
    }

    @Override
    public boolean exists(String imageUrl) {
        try {
            objectStorageClient.headObject(com.oracle.bmc.objectstorage.requests.HeadObjectRequest.builder()
                .namespaceName(properties.getNamespace()).bucketName(properties.getBucketName())
                .objectName(extractObjectNameFromUrl(imageUrl)).build());
            return true;
        } catch (com.oracle.bmc.model.BmcException failure) {
            if (failure.getStatusCode() == 404) return false;
            throw failure;
        }
    }

    @Override
    public void deleteImage(String imageUrl) {
        String objectName = extractObjectNameFromUrl(imageUrl);

        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
            .namespaceName(properties.getNamespace())
            .bucketName(properties.getBucketName())
            .objectName(objectName)
            .build();

        objectStorageClient.deleteObject(deleteObjectRequest);
    }

    @Override
    public boolean supports(String imageUrl) {
        try {
            extractObjectNameFromUrl(imageUrl);
            return (
                imageUrl.contains("objectstorage." + properties.getRegion() + ".oraclecloud.com") &&
                imageUrl.contains(
                    "/n/" + properties.getNamespace() + "/b/" + properties.getBucketName() + "/o/"
                )
            );
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private String getOriginalFileName(MultipartFile multipartFile) {
        String originalFilename = multipartFile.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("[ERROR] 파일 이름이 없습니다.");
        }
        return originalFilename;
    }

    private String buildPublicObjectUrl(String objectName) {
        return String.format(
            "https://objectstorage.%s.oraclecloud.com/n/%s/b/%s/o/%s",
            properties.getRegion(),
            properties.getNamespace(),
            properties.getBucketName(),
            encodePath(objectName)
        );
    }

    private String extractObjectNameFromUrl(String imageUrl) {
        int idx = imageUrl.indexOf(ORACLE_OBJECT_PATH_SEGMENT);
        if (idx == -1) {
            throw new IllegalArgumentException(
                "[ERROR] 올바르지 않은 Oracle Object Storage URL: " + imageUrl
            );
        }

        String encodedObjectName = imageUrl.substring(idx + ORACLE_OBJECT_PATH_SEGMENT.length());
        return URLDecoder.decode(encodedObjectName, StandardCharsets.UTF_8);
    }

    private String encodePath(String path) {
        return java.net.URLEncoder.encode(path, StandardCharsets.UTF_8)
            .replace("+", "%20")
            .replace("%2F", "/");
    }
}
