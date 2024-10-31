package wap.web2.server.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import wap.web2.server.domain.Project;
import wap.web2.server.payload.response.ProjectInfoResponse;
import wap.web2.server.repository.ProjectRepository;

@Service
public class ProjectService {

    ProjectRepository projectRepository;

    @Autowired
    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public List<ProjectInfoResponse> getProjects(Long year, Long semester) {
        return projectRepository.findProjectsByYearAndSemester(year, semester)
            .stream().map(ProjectInfoResponse::from).toList();
    }
}
