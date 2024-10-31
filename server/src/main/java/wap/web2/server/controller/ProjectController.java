package wap.web2.server.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.payload.response.ProjectInfoResponse;
import wap.web2.server.payload.response.ProjectsResponse;
import wap.web2.server.service.ProjectService;

@RestController
@RequestMapping("/project")
public class ProjectController {

    private final ProjectService projectService;

    @Autowired
    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/list")
    public ResponseEntity<?> getProjects(
        @RequestParam("projectYear") Long year,
        @RequestParam("semester") Long semester) {

        List<ProjectInfoResponse> projects = projectService.getProjects(year, semester);
        ProjectsResponse projectsResponse = ProjectsResponse.builder()
            .projectsResponse(projects)
            .build();

        if (projectsResponse.getProjectsResponse().isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(projectsResponse, HttpStatus.OK);
    }
}
