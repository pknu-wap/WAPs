package wap.web2.server.controller;

import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.payload.request.ProjectCreateRequest;
import wap.web2.server.payload.response.ProjectDetailsResponse;
import wap.web2.server.payload.response.ProjectsResponse;
import wap.web2.server.payload.response.ProjectInfoResponse;
import wap.web2.server.service.ProjectService;

import java.io.IOException;
import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/project")
public class ProjectController {

    private final ProjectService projectService;

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

    @PostMapping
    public ResponseEntity<?> createProject(@CurrentUser UserPrincipal userPrincipal,
                                           @RequestPart("image") List<MultipartFile> imageFiles,
                                           @RequestPart("thumbnail") MultipartFile thumbnailFile,
                                           @RequestPart("project") ProjectCreateRequest request) throws IOException {
        // RequestPart 중 ContentType 형식이 다르게 온 file 2종류를 ProjectCreateRequest 에 할당하여 새로운 RequestDto 객체 생성
        ProjectCreateRequest fullRequest = ProjectCreateRequest.builder()
                                            .title(request.getTitle())
                                            .projectType(request.getProjectType())
                                            .content(request.getContent())
                                            .summary(request.getSummary())
                                            .semester(request.getSemester())
                                            .projectYear(request.getProjectYear())
                                            .teamMember(request.getTeamMember())
                                            .techStack(request.getTechStack())
                                            .image(request.getImage())
                                            .imageS3(imageFiles) // image file 초기화
                                            .thumbnail(request.getThumbnail())
                                            .thumbnailS3(thumbnailFile) // thumbnail file 초기화
                                            .build();

        projectService.save(fullRequest, userPrincipal);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<?> getProject(@PathVariable Long projectId) {
        Optional<ProjectDetailsResponse> projectDetails = projectService.getProjectDetails(projectId);

        if(projectDetails.isPresent()) {
            return ResponseEntity.ok(projectDetails.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body("Project not found for id: " + projectId);
    }

    @PutMapping("{projectId}")
    public ResponseEntity<?> updateProject(@PathVariable Long projectId,
                                           @CurrentUser UserPrincipal userPrincipal,
                                           @RequestPart("image") List<MultipartFile> imageFiles,
                                           @RequestPart("thumbnail") MultipartFile thumbnailFile,
                                           @RequestPart("project") ProjectCreateRequest request) throws IOException {
        // RequestPart 중 ContentType 형식이 다르게 온 file 2종류를 ProjectCreateRequest 에 할당하여 새로운 RequestDto 객체 생성
        ProjectCreateRequest fullRequest = ProjectCreateRequest.builder()
                .title(request.getTitle())
                .projectType(request.getProjectType())
                .content(request.getContent())
                .summary(request.getSummary())
                .semester(request.getSemester())
                .projectYear(request.getProjectYear())
                .teamMember(request.getTeamMember())
                .techStack(request.getTechStack())
                .image(request.getImage())
                .imageS3(imageFiles) // image file 초기화
                .thumbnail(request.getThumbnail())
                .thumbnailS3(thumbnailFile) // thumbnail file 초기화
                .build();

        projectService.update(projectId, fullRequest, userPrincipal);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @DeleteMapping("{projectId}")
    public ResponseEntity<?> deleteProject(@PathVariable Long projectId, @CurrentUser UserPrincipal user) {
        try {
            projectService.delete(projectId, user);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An unexpected error occurred.");
        }
    }
}
