package wap.web2.server.aws;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import wap.web2.server.config.AwsS3Config;

@Service
@RequiredArgsConstructor
public class AwsUtils {

    public static String PROJECT_DIR = "projects";
    public static String IMAGES = "images";
    public static String THUMBNAIL = "thumbnail";
    public static String S3_URL_DOMAIN = ".amazonaws.com/";
    public static int S3_DOMAIN_LENGTH = S3_URL_DOMAIN.length();

    private final S3Client s3Client;
    private final AwsS3Config s3Config;

    public List<String> uploadImagesTo(String dirName, Integer projectYear, Integer semester, String projectName,
                                       String imageType, List<MultipartFile> imageFiles) throws IOException {
        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile imageFile : imageFiles) {
            String imageUrl = uploadImageTo(dirName, projectYear, semester, projectName, imageType, imageFile);
            imageUrls.add(imageUrl);
        }

        return imageUrls;
    }

    public String uploadImageTo(String dirName, Integer projectYear, Integer semester, String projectName,
                                String imageType, MultipartFile imageFile) throws IOException {
        String originalFileName = getOriginalFileName(imageFile);
        String fileName = createTimestampFileName(dirName, projectYear, semester, projectName, imageType,
                originalFileName);

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(s3Config.getBucketName())
                .key(fileName)
                //.acl(ObjectCannedACL.PUBLIC_READ) // 퍼블릭 공개
                .contentType(imageFile.getContentType())
                .build();

        s3Client.putObject(putObjectRequest,
                RequestBody.fromInputStream(imageFile.getInputStream(), imageFile.getSize()));

        // 업로드된 파일의 퍼블릭 URL 생성
        return s3Client.utilities()
                .getUrl(builder -> builder.bucket(s3Config.getBucketName()).key(fileName))
                .toExternalForm();
    }

    /**
     * S3의 오브젝트를 삭제합니다.
     *
     * @param imageUrl S3에 저장된 이미지 URL
     */
    public void deleteImage(String imageUrl) {
        String bucket = s3Config.getBucketName();
        String key = extractKeyFromUrl(imageUrl);

        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        s3Client.deleteObject(deleteRequest);
    }

    // S3 URL에서 Key 추출하는 유틸 (URL 예시: https://bucket.s3.region.amazonaws.com/dir1/file.jpg)
    private String extractKeyFromUrl(String url) {
        int idx = url.indexOf(S3_URL_DOMAIN);
        if (idx == -1) {
            throw new IllegalArgumentException("올바르지 않은 S3 URL: " + url);
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

    /**
     * 파일 이름 중복 방지를 위해 랜덤 파일명 생성 원본 파일명 앞에 현재 시간을 붙인다. 이미지 타입은 썸네일인지 본문 이미지인지 구분한다.
     *
     * @return: {디렉토리 이름}/{연도-학기}/{프로젝트 명}/{thumbnail or images}/{업로드 시간}_{원본 파일명}
     */
    private String createTimestampFileName(String dirName, Integer year, Integer semester, String projectName,
                                           String imageType, String originName) {
        return dirName + "/" + year + "-" + semester + "/" + projectName + "/" + imageType + "/" +
                System.currentTimeMillis() + "_" + originName;
    }
}
