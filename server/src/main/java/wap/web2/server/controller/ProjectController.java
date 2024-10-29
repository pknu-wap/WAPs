package wap.web2.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.payload.request.ProjectCreateRequest;
import wap.web2.server.servies.ProjectService;

import java.io.IOException;
import java.util.List;

@RequiredArgsConstructor
@RestController
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping("/project")
    public ResponseEntity<?> createProduct(@RequestPart("image") List<MultipartFile> imageFiles,
                                           @RequestPart("thumbnail") MultipartFile thumbnailFile,
                                           @RequestPart("project") ProjectCreateRequest request) throws IOException {
        // ContentType 이 multipart/form-data 인 file 2종류를 ProjectCreateRequest 에 할당하여 새로운 RequestDto 객체 생성
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

        projectService.save(fullRequest);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
