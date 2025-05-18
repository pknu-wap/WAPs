package wap.web2.server.aws;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import wap.web2.server.config.AwsS3Config;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AwsUtils {

    private final S3Client s3Client;
    private final AwsS3Config s3Config;

    public List<String> uploadImagesToS3(List<MultipartFile> imageFiles) throws IOException {
        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile imageFile : imageFiles) {
            String imageUrl = uploadImageToS3(imageFile);
            imageUrls.add(imageUrl);
        }
        return imageUrls;
    }

    public String uploadImageToS3(MultipartFile imageFile) throws IOException {
        String fileName = System.currentTimeMillis() + "_" + imageFile.getOriginalFilename();

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(s3Config.getBucketName())
                .key(fileName)
                .acl(ObjectCannedACL.PUBLIC_READ) // 퍼블릭 공개
                .contentType(imageFile.getContentType())
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(imageFile.getInputStream(), imageFile.getSize()));

        // 업로드된 파일의 퍼블릭 URL 생성
        return String.format("https://%s.s3.%s.amazonaws.com/%s", s3Config.getBucketName(), s3Config.getRegion(), fileName);
    }
}
