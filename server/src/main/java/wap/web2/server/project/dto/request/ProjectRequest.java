package wap.web2.server.project.dto.request;

import java.util.List;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.springframework.web.multipart.MultipartFile;
import wap.web2.server.member.entity.User;
import wap.web2.server.project.dto.ImageDto;
import wap.web2.server.project.dto.TeamMemberDto;
import wap.web2.server.project.dto.TechStackDto;
import wap.web2.server.project.entity.Image;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.entity.TeamMember;
import wap.web2.server.project.entity.TechStack;
import wap.web2.server.vote.entity.Vote;

// 프로젝트 생성 및 수정에 사용되는 dto
@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRequest {

    private String title;
    private String projectType;
    private String content;
    private String summary;
    private Integer semester;
    private Integer projectYear;
    private String password;
    private List<String> removal; // 삭제할 이미지의 URL

    // teamMemberDto : List 데이터 처리를 위해 Dto 클래스를 따로 생성하여 이용
    private List<TeamMemberDto> teamMember;
    private List<TechStackDto> techStack;

    private List<ImageDto> image; // toEntity 용
    private List<MultipartFile> imageS3; // s3 처리용, 이미지가 url 로 변경된 이후에 stream 적용

    private String thumbnail; // toEntity
    private MultipartFile thumbnailS3; // s3 처리용, 이미지가 url 로 변경된 이후에 stream 적용

    public Project toEntity(ProjectRequest request, List<String> imageUrls, String thumbnailUrl,
                            User user, Vote vote) {

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
                .voteCount(0L)
                .vote(vote)
                .build();
    }

    public void setMultipartFiles(MultipartFile thumbnail, List<MultipartFile> images) {
        this.thumbnailS3 = thumbnail;
        this.imageS3 = images;
    }

}
