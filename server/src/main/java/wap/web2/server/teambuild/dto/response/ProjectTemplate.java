package wap.web2.server.teambuild.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.entity.TechStack;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTemplate {

    private Long projectId;
    private String title;
    private String summary;
    private List<String> techStack;

    public static ProjectTemplate from(Project project) {
        List<TechStack> techStacks = project.getTechStacks();
        List<String> techStackNames = techStacks.stream().map(TechStack::getTechStackName).toList();

        return new ProjectTemplate(project.getProjectId(), project.getTitle(), project.getSummary(), techStackNames);
    }
}
