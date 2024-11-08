package wap.web2.server.service;

import java.io.IOException;
import java.util.List;

import java.util.Objects;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.domain.Project;
import wap.web2.server.domain.User;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.payload.request.ProjectCreateRequest;
import wap.web2.server.payload.response.ProjectDetailsResponse;
import wap.web2.server.payload.response.ProjectInfoResponse;
import wap.web2.server.repository.ProjectRepository;
import wap.web2.server.repository.UserRepository;
import wap.web2.server.util.AwsUtils;

@RequiredArgsConstructor
@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AwsUtils awsUtils;


    @Transactional
    public void save(ProjectCreateRequest request, UserPrincipal userPrincipal) throws IOException {
        //요청토큰에 해당하는 user 를 꺼내옴
        User user = userRepository.findById(userPrincipal.getId()).get();

        List<String> imageUrls = awsUtils.uploadImagesToS3(request.getImageS3());
        String thumbnailUrl = awsUtils.uploadImageToS3(request.getThumbnailS3());

        // request.toEntity() 를 호출함으로서 매개변수로 넘어온 객체(request)를 사용
        Project project = request.toEntity(request, imageUrls, thumbnailUrl, user);

        // 양방향 연관관계 데이터 일관성 유지
        project.getTechStacks().forEach(techStack -> techStack.updateTechStack(project));
        project.getTeamMembers().forEach(teamMember -> teamMember.updateTeamMember(project));
        project.getImages().forEach(image -> image.updateImage(project));

        projectRepository.save(project);
    }

    public List<ProjectInfoResponse> getProjects(Long year, Long semester) {
        return projectRepository.findProjectsByYearAndSemester(year, semester)
            .stream().map(ProjectInfoResponse::from).toList();
    }

    public Optional<ProjectDetailsResponse> getProjectDetails(Long projectId) {
        return projectRepository.findById(projectId).map(ProjectDetailsResponse::from);
    }
}
