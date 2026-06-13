package wap.web2.server.project.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.project.dto.TeamMemberDto;
import wap.web2.server.project.dto.TechStackDto;
import wap.web2.server.project.dto.request.ProjectRequest;
import wap.web2.server.project.entity.Image;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.storage.ObjectStorageService;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    ProjectRepository projectRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    ObjectStorageService objectStorageService;

    @InjectMocks
    ProjectService projectService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(projectService, "projectPassword", "pw");
    }

    @Test
    void removal이_없어도_프로젝트_수정은_성공한다() throws Exception {
        // given
        User owner = owner();
        UserPrincipal principal = principal(owner.getId());
        Project project = project(owner);

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectRepository.findById(project.getProjectId())).thenReturn(Optional.of(project));

        ProjectRequest request = baseRequestBuilder()
                .removal(null)
                .build();

        // when
        String result = projectService.update(project.getProjectId(), request, principal);

        // then
        assertThat(result).isEqualTo("수정되었습니다.");
        assertThat(project.getTitle()).isEqualTo("updated title");
        verify(objectStorageService, never()).deleteImage(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void 빈_파일_part는_첨부되지_않은_파일로_취급한다() throws Exception {
        // given
        User owner = owner();
        UserPrincipal principal = principal(owner.getId());
        Project project = project(owner);

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectRepository.findById(project.getProjectId())).thenReturn(Optional.of(project));

        ProjectRequest request = baseRequestBuilder()
                .removal(null)
                .build();
        request.setMultipartFiles(
                new MockMultipartFile("thumbnail", "", "image/png", new byte[0]),
                List.of(new MockMultipartFile("image", "", "image/png", new byte[0]))
        );

        // when
        projectService.update(project.getProjectId(), request, principal);

        // then
        verify(objectStorageService, never()).uploadImage(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.any()
        );
        verify(objectStorageService, never()).uploadImages(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyList()
        );
    }

    @Test
    void 삭제_요청된_이미지는_프로젝트_컬렉션에서_제거하고_스토리지에서도_삭제한다() throws Exception {
        // given
        User owner = owner();
        UserPrincipal principal = principal(owner.getId());
        Project project = project(owner);
        project.addAllImage(Image.listOf(List.of("https://cdn.example.com/a.png", "https://cdn.example.com/b.png")));

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectRepository.findById(project.getProjectId())).thenReturn(Optional.of(project));
        when(objectStorageService.supports("https://cdn.example.com/a.png")).thenReturn(true);

        ProjectRequest request = baseRequestBuilder()
                .removal(List.of("https://cdn.example.com/a.png", "https://cdn.example.com/missing.png"))
                .build();

        // when
        projectService.update(project.getProjectId(), request, principal);

        // then
        assertThat(project.getImages())
                .extracting(Image::getImageFile)
                .containsExactly("https://cdn.example.com/b.png");
        verify(objectStorageService).deleteImage("https://cdn.example.com/a.png");
        verify(objectStorageService, never()).deleteImage("https://cdn.example.com/missing.png");
    }

    @Test
    void 현재_스토리지에서_관리하지_않는_이미지는_프로젝트_컬렉션에서만_제거한다() throws Exception {
        // given
        User owner = owner();
        UserPrincipal principal = principal(owner.getId());
        Project project = project(owner);
        String legacyS3Url = "https://waps-bucket.s3.ap-northeast-2.amazonaws.com/projects/2025-2/test/image.png";
        project.addAllImage(Image.listOf(List.of(legacyS3Url)));

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectRepository.findById(project.getProjectId())).thenReturn(Optional.of(project));
        when(objectStorageService.supports(legacyS3Url)).thenReturn(false);

        ProjectRequest request = baseRequestBuilder()
                .removal(List.of(legacyS3Url))
                .build();

        // when
        projectService.update(project.getProjectId(), request, principal);

        // then
        assertThat(project.getImages()).isEmpty();
        verify(objectStorageService, never()).deleteImage(legacyS3Url);
    }

    private ProjectRequest.ProjectRequestBuilder baseRequestBuilder() {
        return ProjectRequest.builder()
                .title("updated title")
                .projectType("WEB")
                .content("updated content")
                .summary("updated summary")
                .semester("2026-01")
                .password("pw")
                .teamMember(List.of(TeamMemberDto.builder()
                        .memberName("member")
                        .memberRole("backend")
                        .build()))
                .techStack(List.of(TechStackDto.builder()
                        .techStackName("Spring")
                        .techStackType("BACKEND")
                        .build()));
    }

    private User owner() {
        User user = new User();
        user.setId(1L);
        user.setName("owner");
        return user;
    }

    private UserPrincipal principal(Long userId) {
        UserPrincipal principal = mock(UserPrincipal.class);
        when(principal.getId()).thenReturn(userId);
        return principal;
    }

    private Project project(User owner) {
        return Project.builder()
                .projectId(10L)
                .user(owner)
                .title("old title")
                .projectType("WEB")
                .content("old content")
                .summary("old summary")
                .semester("2026-01")
                .images(new ArrayList<>())
                .teamMembers(new ArrayList<>())
                .techStacks(new ArrayList<>())
                .build();
    }
}
