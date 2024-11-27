package wap.web2.server.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Generated;
import lombok.Getter;
import wap.web2.server.domain.Project;
import wap.web2.server.payload.CommentDto;
import wap.web2.server.payload.TeamMemberDto;
import wap.web2.server.payload.TechStackDto;

import java.util.List;

@Builder
@AllArgsConstructor
@Getter
public class ProjectUpdateDetailsResponse {

    private Long projectId;
    private String title;
    private String projectType;
    private String content;
    private String summary;
    private Integer semester;
    private Long vote;
    private Integer projectYear;
    private List<TeamMemberDto> teamMember;
    private List<CommentDto> comments;

    public static ProjectUpdateDetailsResponse from(Project project) {
        List<TeamMemberDto> teamMembers = project.getTeamMembers().stream()
                .map(TeamMemberDto::from).toList();
        List<CommentDto> comments = project.getComments().stream()
                .map(CommentDto::from).toList();

        return ProjectUpdateDetailsResponse.builder()
                .projectId(project.getProjectId())
                .title(project.getTitle())
                .projectType(project.getProjectType())
                .content(project.getContent())
                .summary(project.getSummary())
                .semester(project.getSemester())
                .vote(project.getVote())
                .projectYear(project.getProjectYear())
                .teamMember(teamMembers)
                .comments(comments)
                .build();
    }

}
