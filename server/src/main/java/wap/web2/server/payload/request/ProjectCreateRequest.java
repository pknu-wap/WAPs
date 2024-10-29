package wap.web2.server.payload.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;
import wap.web2.server.payload.ImageDto;
import wap.web2.server.payload.teamMemberDto;
import wap.web2.server.payload.techStackDto;

import java.util.List;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectCreateRequest {

    private String title;
    private String projectType;
    private String content;
    private String summary;
    private Integer semester;
    private Integer projectYear;

    // List 데이터 처리를 위해 Dto 클래스를 따로 생성하여 이용
    private List<teamMemberDto> teamMember;
    private List<techStackDto> techStack;

    private List<ImageDto> image;
    private List<MultipartFile> imageS3; // s3 처리용, 이미지가 url 로 변경된 이후에 바로 위의 필드에 담김

    private String thumbnail;
    private MultipartFile thumbnailS3; // s3 처리용, 이미지가 url 로 변경된 이후에 바로 위의 필드에 담김

}
