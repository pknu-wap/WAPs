package wap.web2.server.storage.impl;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import wap.web2.server.config.s3.S3Properties;
import wap.web2.server.storage.ObjectStorageService;
import wap.web2.server.storage.StoragePathUtils;

@Service
@Profile("aws")
@RequiredArgsConstructor
public class S3ObjectStorageService implements ObjectStorageService {

    private static final String S3_URL_DOMAIN = ".amazonaws.com/";
    private static final int S3_DOMAIN_LENGTH = S3_URL_DOMAIN.length();

    private final S3Client s3Client;
    private final S3Properties s3Properties;

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
        String originalFileName = getOriginalFileName(imageFile);
        String fileName = StoragePathUtils.createTimestampFileName(
                dirName, projectYear, semester, projectName, imageType, originalFileName
        );

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(s3Properties.getS3().getBucketName())
                .key(fileName)
                .contentType(imageFile.getContentType())
                .build();

        s3Client.putObject(
                putObjectRequest,
                RequestBody.fromInputStream(imageFile.getInputStream(), imageFile.getSize())
        );

        return s3Client.utilities()
                .getUrl(builder -> builder.bucket(s3Properties.getS3().getBucketName()).key(fileName))
                .toExternalForm();
    }

    @Override
    public void deleteImage(String imageUrl) {
        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(s3Properties.getS3().getBucketName())
                .key(extractKeyFromUrl(imageUrl))
                .build();

        s3Client.deleteObject(deleteRequest);
    }

    private String extractKeyFromUrl(String url) {
        int idx = url.indexOf(S3_URL_DOMAIN);
        if (idx == -1) {
            throw new IllegalArgumentException("[ERROR] 올바르지 않은 S3 URL: " + url);
        }
        return url.substring(idx + S3_DOMAIN_LENGTH);
    }

    private String getOriginalFileName(MultipartFile multipartFile) {
        String originalFilename = multipartFile.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("[ERROR] 파일 이름이 없습니다.");
        }
        return originalFilename;
    }

}
