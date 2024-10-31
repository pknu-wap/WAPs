package wap.web2.server.payload.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import wap.web2.server.domain.Project;

@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ProjectInfoResponse {

    private Long projectId;
    private String title;
    private String projectType;
    private String summary;
    private Long semester;
    private Long projectYear;
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
