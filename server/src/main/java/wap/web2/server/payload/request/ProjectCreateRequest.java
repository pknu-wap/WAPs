package wap.web2.server.payload.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;
import wap.web2.server.domain.Image;
import wap.web2.server.domain.Project;
import wap.web2.server.domain.TeamMember;
import wap.web2.server.domain.TechStack;
import wap.web2.server.payload.ImageDto;
import wap.web2.server.payload.TeamMemberDto;
import wap.web2.server.payload.TechStackDto;

import java.util.List;
import java.util.stream.Collectors;

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

    // teamMemberDto : List 데이터 처리를 위해 Dto 클래스를 따로 생성하여 이용
    private List<TeamMemberDto> teamMember;
    private List<TechStackDto> techStack;

    private List<ImageDto> image;
    private List<MultipartFile> imageS3; // s3 처리용, 이미지가 url 로 변경된 이후에 stream 적용

    private String thumbnail;
    private MultipartFile thumbnailS3; // s3 처리용, 이미지가 url 로 변경된 이후에 stream 적용

    public Project toEntity(List<String> imageUrls, String thumbnailUrl) {

        List<Image> imagesEntities = imageUrls.stream()
                .map(ImageDto::toEntity)
                .collect(Collectors.toList());

        List<TechStack> techStacksEntities = techStack.stream()
                .map(TechStackDto::toEntity)
                .collect(Collectors.toList());

        List<TeamMember> teamMemberEntities = teamMember.stream()
                .map(TeamMemberDto::toEntity)
                .collect(Collectors.toList());

        // ProjectCreateRequest 클래스 내에 필드들을 사용 (ProjectCreateRequest 타입의 객체를 사용 했으므로)
        return Project.builder()
                .title(this.title)
                .projectType(this.projectType)
                .content(this.content)
                .summary(this.summary)
                .semester(this.semester)
                .projectYear(this.projectYear)
                .images(imagesEntities)
                .techStacks(techStacksEntities)
                .teamMembers(teamMemberEntities)
                .thumbnail(thumbnailUrl)
                .build();
    }
}
