package wap.web2.server.project.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import wap.web2.server.project.entity.Project;

@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ProjectInfoResponse {

    private Long projectId;
    private String title;
    private String projectType;
    private String summary;
    private Integer semester;
    private Integer projectYear;
    private String thumbnail;

    public static ProjectInfoResponse from(Project project) {
        return ProjectInfoResponse.builder()
            .projectId(project.getProjectId())
            .title(project.getTitle())
            .projectType(project.getProjectType())
            .summary(project.getSummary())
            .semester(project.getSemester())
            .projectYear(project.getProjectYear())
            .thumbnail(project.getThumbnail())
            .build();
    }
}
