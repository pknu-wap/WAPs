package wap.web2.server.payload.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;
import wap.web2.server.domain.*;
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

    public Project toEntity(ProjectCreateRequest request, List<String> imageUrls, String thumbnailUrl,
                            User user) {

        List<Image> imagesEntities = imageUrls.stream()
                .map(ImageDto::toEntity)
                .collect(Collectors.toList());

        List<TechStack> techStacksEntities = request.getTechStack().stream()
                .map(TechStackDto::toEntity)
                .collect(Collectors.toList());

        List<TeamMember> teamMemberEntities = request.getTeamMember().stream()
                .map(TeamMemberDto::toEntity)
                .collect(Collectors.toList());

        return Project.builder()
                .user(user)
                .title(request.getTitle())
                .projectType(request.getProjectType())
                .content(request.getContent())
                .summary(request.getSummary())
                .semester(request.getSemester())
                .projectYear(request.getProjectYear())
                .images(imagesEntities)
                .techStacks(techStacksEntities)
                .teamMembers(teamMemberEntities)
                .thumbnail(thumbnailUrl)
                .build();
    }
}
