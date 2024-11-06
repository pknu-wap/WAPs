package wap.web2.server.payload.response;

import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import wap.web2.server.domain.Image;
import wap.web2.server.domain.Project;
import wap.web2.server.domain.TeamMember;
import wap.web2.server.domain.TechStack;

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
    private List<TeamMember> teamMember;
    private List<TechStack> techStack;
    private List<Image> images;

    public static ProjectDetailsResponse from(Project project) {
        return ProjectDetailsResponse.builder()
            .projectId(project.getProjectId())
            .title(project.getTitle())
            .projectType(project.getProjectType())
            .content(project.getContent())
            .summary(project.getSummary())
            .semester(project.getSemester())
            .vote(project.getVote())
            .projectYear(project.getProjectYear())
            .thumbnail(project.getThumbnail())
            .teamMember(project.getTeamMembers())
            .techStack(project.getTechStacks())
            .images(project.getImages())
            .build();
    }
}
