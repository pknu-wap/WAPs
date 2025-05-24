package wap.web2.server.project.service;

import static wap.web2.server.aws.AwsUtils.IMAGES;
import static wap.web2.server.aws.AwsUtils.PROJECT_DIR;
import static wap.web2.server.aws.AwsUtils.THUMBNAIL;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.aws.AwsUtils;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.dto.request.ProjectCreateRequest;
import wap.web2.server.project.dto.response.ProjectDetailsResponse;
import wap.web2.server.project.dto.response.ProjectInfoResponse;
import wap.web2.server.project.dto.response.ProjectUpdateDetailsResponse;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.vote.entity.Vote;
import wap.web2.server.vote.repository.VoteRepository;

@Slf4j
@RequiredArgsConstructor
@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final AwsUtils awsUtils;

    @Value("${project.password}")
    private String projectPassword;

    @Transactional
    public String save(ProjectCreateRequest request, UserPrincipal userPrincipal) throws IOException {

        if (request.getPassword() == null || !request.getPassword().equals(projectPassword)) {
            return "비밀번호가 틀렸습니다.";
        }

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));
        Vote vote = voteRepository.findVoteByYearAndSemester(request.getProjectYear(), request.getSemester())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] Year-Semester not found"));

        List<String> imageUrls = awsUtils.uploadImagesTo(PROJECT_DIR, request.getProjectYear(), request.getSemester(),
                request.getTitle(), IMAGES, request.getImageS3());
        String thumbnailUrl = awsUtils.uploadImageTo(PROJECT_DIR, request.getProjectYear(), request.getSemester(),
                request.getTitle(), THUMBNAIL, request.getThumbnailS3());
        
        // request.toEntity() 를 호출함으로서 매개변수로 넘어온 객체(request)를 사용
        // 기괴한 구조 ㄷㄷ
        Project project = request.toEntity(request, imageUrls, thumbnailUrl, user, vote);

        // 양방향 연관관계 데이터 일관성 유지
        project.getTechStacks().forEach(techStack -> techStack.updateTechStack(project));
        project.getTeamMembers().forEach(teamMember -> teamMember.updateTeamMember(project));
        project.getImages().forEach(image -> image.updateImage(project));

        projectRepository.save(project);

        return "등록되었습니다.";
    }

    public List<ProjectInfoResponse> getProjects(Long year, Long semester) {
        return projectRepository.findProjectsByYearAndSemesterOrderByProjectIdDesc(year, semester)
                .stream().map(ProjectInfoResponse::from).toList();
    }

    public Optional<ProjectDetailsResponse> getProjectDetails(Long projectId) {
        return projectRepository.findById(projectId).map(ProjectDetailsResponse::from);
    }

    public ProjectDetailsResponse getProjectDetailsForUpdate(Long projectId, UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new IllegalArgumentException();
        }

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid user Id"));

        log.info("[수정 요청] - 유저ID: {}, 유저명: {}, 프로젝트ID: {}", user.getId(), user.getName(), projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("프로젝트가 없습니다."));

        if (!project.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("수정 권한이 없습니다.");
        }

        return ProjectDetailsResponse.from(project);
    }

    @Transactional
    public String update(Long projectId, ProjectCreateRequest request, UserPrincipal userPrincipal) throws IOException {

        if (request.getPassword() == null || !request.getPassword().equals(projectPassword)) {
            return "비밀번호가 틀렸습니다.";
        }
        //요청토큰에 해당하는 user 를 꺼내옴
        User user = userRepository.findById(userPrincipal.getId()).get();

        Project project = projectRepository.findByProjectIdAndUser(projectId, user.getId());

        List<String> imageUrls = awsUtils.uploadImagesTo(PROJECT_DIR, request.getProjectYear(), request.getSemester(),
                request.getTitle(), IMAGES, request.getImageS3());
        String thumbnailUrl = awsUtils.uploadImageTo(PROJECT_DIR, request.getProjectYear(), request.getSemester(),
                request.getTitle(), THUMBNAIL, request.getThumbnailS3());

        project.update(request, imageUrls, thumbnailUrl);

        return "수정되었습니다.";

    }

    @Transactional
    public void delete(Long projectId, UserPrincipal userPrincipal) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));

        Project project = projectRepository.findByProjectIdAndUser(projectId, user.getId());

        if (project == null) {
            throw new IllegalArgumentException("[ERROR] 해당 사용자에게 삭제 권한이 없습니다.");
        }
        projectRepository.delete(project);
    }
}
