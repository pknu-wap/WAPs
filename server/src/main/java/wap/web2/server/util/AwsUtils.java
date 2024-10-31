package wap.web2.server.util;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.PutObjectRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import wap.web2.server.config.AwsS3Config;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AwsUtils {

    private final AmazonS3 amazonS3;
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
        amazonS3.putObject(new PutObjectRequest(s3Config.getBucketName(), fileName, imageFile.getInputStream(), null)
                .withCannedAcl(CannedAccessControlList.PublicRead));
        return amazonS3.getUrl(s3Config.getBucketName(), fileName).toString();
    }
}
