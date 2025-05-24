package wap.web2.server.project.dto.response;

import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import wap.web2.server.comment.dto.CommentDto;
import wap.web2.server.project.dto.ImageDto;
import wap.web2.server.project.dto.TeamMemberDto;
import wap.web2.server.project.dto.TechStackDto;
import wap.web2.server.project.entity.Project;

@Builder
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ProjectDetailsResponse {

    private Long projectId;
    private String title;
    private String projectType;
    private String content;
    private String summary;
    private Integer semester;
    private Long vote;
    private Integer projectYear;
    private String thumbnail;
    private List<TeamMemberDto> teamMember;
    private List<TechStackDto> techStack;
    private List<ImageDto> images;
    private List<CommentDto> comments;

    public static ProjectDetailsResponse from(Project project) {
        List<TeamMemberDto> teamMembers = project.getTeamMembers().stream()
                .map(TeamMemberDto::from).toList();
        List<ImageDto> images = project.getImages().stream()
                .map(ImageDto::from).toList();
        List<TechStackDto> techStacks = project.getTechStacks().stream()
                .map(TechStackDto::from).toList();
        List<CommentDto> comments = project.getComments().stream()
                .map(CommentDto::from).toList();

        return ProjectDetailsResponse.builder()
                .projectId(project.getProjectId())
                .title(project.getTitle())
                .projectType(project.getProjectType())
                .content(project.getContent())
                .summary(project.getSummary())
                .semester(project.getSemester())
                .vote(project.getVoteCount())
                .projectYear(project.getProjectYear())
                .thumbnail(project.getThumbnail())
                .teamMember(teamMembers)
                .techStack(techStacks)
                .images(images)
                .comments(comments)
                .build();
    }
}
