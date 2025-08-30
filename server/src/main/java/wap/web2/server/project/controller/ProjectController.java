package wap.web2.server.project.controller;

import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.dto.RecruitmentDto;
import wap.web2.server.project.dto.request.ProjectAppliesRequest;
import wap.web2.server.project.dto.request.ProjectRequest;
import wap.web2.server.project.dto.response.ProjectAppliesResponse;
import wap.web2.server.project.dto.response.ProjectDetailsResponse;
import wap.web2.server.project.dto.response.ProjectInfoResponse;
import wap.web2.server.project.dto.response.ProjectsResponse;
import wap.web2.server.project.service.ApplyService;
import wap.web2.server.project.service.ProjectService;

@RestController
@RequestMapping("/project")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final ApplyService applyService;

    // TODO: ProjectsResponse에 담기 전에 검사하는건 별로인가요?
    //  또는 컨트롤러에서는 try catch를 두고 ProjectResponse안에서 throw 하는 것은?
    @GetMapping("/list")
    public ResponseEntity<?> getProjects(@RequestParam("projectYear") Long year,
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
                                           @RequestPart("project") ProjectRequest request) throws IOException {
        // RequestPart 중 ContentType 형식이 다르게 온 file 2종류를 ProjectCreateRequest 에 할당하여 새로운 RequestDto 객체 생성
        ProjectRequest fullRequest = ProjectRequest.builder()
                .title(request.getTitle())
                .projectType(request.getProjectType())
                .content(request.getContent())
                .summary(request.getSummary())
                .semester(request.getSemester())
                .projectYear(request.getProjectYear())
                .password(request.getPassword())
                .teamMember(request.getTeamMember())
                .techStack(request.getTechStack())
                .image(request.getImage())
                .imageS3(imageFiles) // image file 초기화
                .thumbnail(request.getThumbnail())
                .thumbnailS3(thumbnailFile) // thumbnail file 초기화
                .build();

        // 비밀번호가 null 인지 체크
        if (fullRequest.getPassword() == null) {
            return ResponseEntity.status(400).body("비밀번호를 입력하세요.");
        }

        String result = projectService.save(fullRequest, userPrincipal);

        if (result.equals("비밀번호가 틀렸습니다.")) {
            return ResponseEntity.status(401).body(result);
        } else {
            return ResponseEntity.status(201).body(result);
        }
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<?> getProject(@PathVariable Long projectId) {
        Optional<ProjectDetailsResponse> projectDetails = projectService.getProjectDetails(projectId);

        if (projectDetails.isPresent()) {
            return ResponseEntity.ok(projectDetails.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Project not found for id: " + projectId);
    }

    @GetMapping("/{projectId}/update")
    public ResponseEntity<?> getProjectDetailsForUpdate(@PathVariable Long projectId,
                                                        @CurrentUser UserPrincipal userPrincipal) {
        try {
            // 프로젝트 상세 정보를 가져오는 서비스 호출
            ProjectDetailsResponse response = projectService.getProjectDetailsForUpdate(projectId, userPrincipal);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException ex) {
            // 유효하지 않은 유저 ID
            return ResponseEntity.status(403).body("수정 권한이 없습니다.");
        }
    }

    @PutMapping("{projectId}")
    public ResponseEntity<?> updateProject(@PathVariable Long projectId,
                                           @CurrentUser UserPrincipal userPrincipal,
                                           @RequestPart(value = "image", required = false) List<MultipartFile> imageFiles,
                                           @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnailFile,
                                           @RequestPart("project") ProjectRequest request) throws IOException {
        // RequestPart 중 ContentType 형식이 다르게 온 file 2종류를 ProjectRequest 에 할당
        request.setMultipartFiles(thumbnailFile, imageFiles);

        // 비밀번호가 null 인지 체크
        if (request.getPassword() == null) {
            return ResponseEntity.status(400).body("비밀번호를 입력하세요.");
        }

        String result = projectService.update(projectId, request, userPrincipal);
        if (result.equals("비밀번호가 틀렸습니다.")) {
            return ResponseEntity.status(401).body(result);
        } else {
            return ResponseEntity.status(201).body(result);
        }
    }

    @DeleteMapping("{projectId}")
    public ResponseEntity<?> deleteProject(@PathVariable Long projectId, @CurrentUser UserPrincipal user) {
        try {
            projectService.delete(projectId, user);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred.");
        }
    }

    // TODO: 패키지 분리에 대한 의논 필요
    // 프로젝트 신청 (for 팀원)
    @PostMapping("/apply")
    public ResponseEntity<?> apply(@CurrentUser UserPrincipal userPrincipal,
                                   @Valid @RequestBody ProjectAppliesRequest request) {
        try {
            applyService.apply(userPrincipal, request);
            return ResponseEntity.ok().body("[INFO ] 성공적으로 지원하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 지원 실패");
        }
    }

    // 프로젝트에 신청한 사람 보기 (for 팀장)
    @GetMapping("{projectId}/applies")
    public ResponseEntity<?> getApplies(@CurrentUser UserPrincipal userPrincipal,
                                        @PathVariable("projectId") Long projectId) {
        try {
            ProjectAppliesResponse response = applyService.getApplies(userPrincipal, projectId);
            return ResponseEntity.ok().body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/preference")
    public ResponseEntity<?> setPreference(@CurrentUser UserPrincipal userPrincipal,
                                           @Valid @RequestBody RecruitmentDto request) {
        try {
            applyService.setPreference(userPrincipal, request);
            return ResponseEntity.ok().body("[INFO ] 성공적으로 등록하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 등록 실패" + e.getMessage());
        }
    }

}
