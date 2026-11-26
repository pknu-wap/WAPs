package wap.web2.server.project.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.exception.ForbiddenException;
import wap.web2.server.exception.ProjectPasswordInvalidException;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.project.dto.RecruitmentPositionDto;
import wap.web2.server.project.dto.response.ProjectDetailsResponse;
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
    void detailsAndEditKeepStoredTeamMemberNamesAndRoles() {
        var owner = owner();
        var project = project(owner);
        project.getTeamMembers().add(
            wap.web2.server.project.entity.TeamMember.builder()
                .memberName("저장된 이름")
                .memberRole("PM")
                .build());
        when(projectRepository.findById(project.getProjectId())).thenReturn(Optional.of(project));
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));

        var details = projectService.getProjectDetails(project.getProjectId(), null);
        var edit = projectService.getProjectDetailsForUpdate(project.getProjectId(), principal(owner.getId()));
        for (var response : List.of(details, edit)) {
            assertThat(response.getTeamMember()).extracting(TeamMemberDto::getMemberName)
                .containsExactly("저장된 이름");
            assertThat(response.getTeamMember().get(0).getMemberRole()).isEqualTo("PM");
        }
    }

    @Test
    void recruitProjectsUsesCurrentSemesterAndAuthenticatedOwner() {
        String semester = wap.web2.server.util.SemesterGenerator.generateSemester();
        when(projectRepository.findAllByUser_IdAndSemesterOrderByProjectIdDesc(7L, semester))
            .thenReturn(List.of(Project.builder().projectId(42L).title("내 프로젝트").build()));

        assertThat(projectService.getMyRecruitProjects(7L)).singleElement().satisfies(project -> {
            assertThat(project.projectId()).isEqualTo(42L);
            assertThat(project.title()).isEqualTo("내 프로젝트");
        });
        verify(projectRepository).findAllByUser_IdAndSemesterOrderByProjectIdDesc(7L, semester);
    }

    @Test
    void removal이_없어도_프로젝트_수정은_성공한다() throws Exception {
        // given
        User owner = owner();
        UserPrincipal principal = principal(owner.getId());
        Project project = project(owner);

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectRepository.findById(project.getProjectId())).thenReturn(Optional.of(project));

        ProjectRequest request = baseRequestBuilder().removal(null).build();

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

        ProjectRequest request = baseRequestBuilder().removal(null).build();
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
    void 삭제_요청된_이미지는_프로젝트_컬렉션에서_제거하고_스토리지에는_보존한다()
        throws Exception {
        // given
        User owner = owner();
        UserPrincipal principal = principal(owner.getId());
        Project project = project(owner);
        project.addAllImage(
            Image.listOf(List.of("https://cdn.example.com/a.png", "https://cdn.example.com/b.png"))
        );

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectRepository.findById(project.getProjectId())).thenReturn(Optional.of(project));

        ProjectRequest request = baseRequestBuilder()
            .removal(
                List.of("https://cdn.example.com/a.png", "https://cdn.example.com/missing.png")
            )
            .build();

        // when
        projectService.update(project.getProjectId(), request, principal);

        // then
        assertThat(project.getImages())
            .extracting(Image::getImageFile)
            .containsExactly("https://cdn.example.com/b.png");
        verifyNoInteractions(objectStorageService);
    }

    @Test
    void 현재_스토리지에서_관리하지_않는_이미지는_프로젝트_컬렉션에서만_제거한다()
        throws Exception {
        // given
        User owner = owner();
        UserPrincipal principal = principal(owner.getId());
        Project project = project(owner);
        String legacyS3Url =
            "https://waps-bucket.s3.ap-northeast-2.amazonaws.com/projects/2025-2/test/image.png";
        project.addAllImage(Image.listOf(List.of(legacyS3Url)));

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectRepository.findById(project.getProjectId())).thenReturn(Optional.of(project));

        ProjectRequest request = baseRequestBuilder().removal(List.of(legacyS3Url)).build();

        // when
        projectService.update(project.getProjectId(), request, principal);

        // then
        assertThat(project.getImages()).isEmpty();
        verifyNoInteractions(objectStorageService);
    }

    @ParameterizedTest
    @CsvSource({ "1, ROLE_MEMBER", "2, ROLE_ADMIN" })
    void 작성자와_관리자는_수정_조회와_수정_삭제가_가능하다(Long userId, Role role) throws Exception {
        User owner = owner();
        User user = new User();
        user.setId(userId);
        user.setRole(role);
        UserPrincipal principal = principal(userId);
        Project project = project(owner);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        var details = projectService.getProjectDetails(10L, principal);
        assertThat(details.getIsOwner()).isEqualTo(userId.equals(owner.getId()));
        assertThat(details.getCanManage()).isTrue();
        var updateDetails = projectService.getProjectDetailsForUpdate(10L, principal);
        assertThat(updateDetails.getProjectId()).isEqualTo(10L);
        assertThat(updateDetails.getCanManage()).isTrue();
        assertThat(updateDetails.getIsOwner()).isEqualTo(userId.equals(owner.getId()));
        projectService.update(10L, baseRequestBuilder().teamMember(List.of(
            TeamMemberDto.builder().memberName("member").memberRole("PM").build())).build(), principal);
        assertThat(project.getTitle()).isEqualTo("updated title");
        assertThat(project.getUser()).isSameAs(owner);
        when(projectRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(project));
        projectService.delete(10L, principal);
        verify(projectRepository).delete(project);
    }

    @Test
    void 게스트_작성자는_기존_프로젝트를_수정할_수_있고_삭제는_거절된다() throws Exception {
        User owner = owner();
        owner.setRole(Role.ROLE_GUEST);
        Project project = project(owner);
        UserPrincipal principal = principal(owner.getId());
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        for (var details : List.of(projectService.getProjectDetails(10L, principal),
                projectService.getProjectDetailsForUpdate(10L, principal))) {
            assertThat(details.getIsOwner()).isTrue();
            assertThat(details.getCanManage()).isFalse();
        }
        projectService.update(10L, baseRequestBuilder().build(), principal);
        assertThat(project.getTitle()).isEqualTo("updated title");

        when(projectRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(project));
        assertThatThrownBy(() -> projectService.delete(10L, principal))
            .isInstanceOf(ForbiddenException.class);
        verify(projectRepository, never()).delete(project);
    }

    @ParameterizedTest
    @CsvSource({ "ROLE_MEMBER", "ROLE_GUEST" })
    void 작성자가_아닌_일반_사용자는_수정_조회와_수정_삭제가_금지된다(Role role) {
        User user = new User();
        user.setId(2L);
        user.setRole(role);
        UserPrincipal principal = principal(2L);
        Project project = project(owner());
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        var details = projectService.getProjectDetails(10L, principal);
        assertThat(details.getIsOwner()).isFalse();
        assertThat(details.getCanManage()).isFalse();
        assertThatThrownBy(() -> projectService.getProjectDetailsForUpdate(10L, principal))
            .isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> projectService.update(10L, baseRequestBuilder().build(), principal))
            .isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> projectService.update(10L, baseRequestBuilder().password("wrong").build(), principal))
            .isInstanceOf(ForbiddenException.class);
        when(projectRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(project));
        assertThatThrownBy(() -> projectService.delete(10L, principal))
            .isInstanceOf(ForbiddenException.class);
        assertThat(project.getTitle()).isEqualTo("old title");
        verify(projectRepository, never()).delete(project);
        verifyNoInteractions(objectStorageService);
    }

    @Test
    void 비로그인_조회에는_관리_권한이_없고_수정_조회는_금지된다() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project(owner())));

        var details = projectService.getProjectDetails(10L, null);
        assertThat(details.getIsOwner()).isFalse();
        assertThat(details.getCanManage()).isFalse();
        assertThatThrownBy(() -> projectService.getProjectDetailsForUpdate(10L, null))
            .isInstanceOf(ForbiddenException.class);
    }

    @ParameterizedTest
    @CsvSource({ "1, ROLE_GUEST", "2, ROLE_ADMIN" })
    void 수정_권한이_있어도_프로젝트_인증번호가_필요하다(Long id, Role role) {
        User user = new User();
        user.setId(id);
        user.setRole(role);
        Project project = project(owner());
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        UserPrincipal principal = principal(id);
        ProjectRequest request = baseRequestBuilder().password("wrong").build();

        assertThatThrownBy(() -> projectService.update(10L, request, principal))
            .isInstanceOf(ProjectPasswordInvalidException.class);
        assertThat(project.getTitle()).isEqualTo("old title");
        verifyNoInteractions(objectStorageService);
    }

    @Test
    void 모집_인원을_생성_조회_수정_삭제한다() {
        var positions = List.of(
            new RecruitmentPositionDto("프론트엔드", 3),
            new RecruitmentPositionDto("백엔드", 2));
        ProjectRequest request = baseRequestBuilder().recruitmentPositions(positions).build();
        Project project = request.toEntity(request, "2026-02", List.of(), "", owner());
        assertThat(ProjectDetailsResponse.from(project)
            .getRecruitmentPositions()).containsExactlyElementsOf(positions);
        project.update(baseRequestBuilder().build());
        assertThat(project.getRecruitmentPositions()).hasSize(2);
        project.update(baseRequestBuilder().recruitmentPositions(List.of(positions.get(1))).build());
        assertThat(project.getRecruitmentPositions()).singleElement().satisfies(position -> {
            assertThat(position.getRole()).isEqualTo("백엔드");
            assertThat(position.getCount()).isEqualTo(2);
        });
        project.update(baseRequestBuilder().recruitmentPositions(List.of()).build());
        assertThat(project.getRecruitmentPositions()).isEmpty();
        assertThat(baseRequestBuilder().build().toEntity(baseRequestBuilder().build(), "2026-02", List.of(), "", owner())
            .getRecruitmentPositions()).isEmpty();
    }

    @Test
    void 잘못된_모집_정보는_거절한다() {
        var invalid = java.util.Arrays.asList(
            new RecruitmentPositionDto(" ", 1),
            new RecruitmentPositionDto("백엔드", 0),
            new RecruitmentPositionDto("백엔드", -1),
            new RecruitmentPositionDto("백엔드", null),
            new RecruitmentPositionDto("가".repeat(51), 1), null);
        for (var position : invalid) {
            assertThatThrownBy(() -> RecruitmentPositionDto.toEntities(
                java.util.Arrays.asList(position)))
                .isInstanceOf(BadRequestException.class);
        }
        assertThatThrownBy(() -> RecruitmentPositionDto.toEntities(List.of(
            new RecruitmentPositionDto("백엔드", 1),
            new RecruitmentPositionDto(" BACKEND ", 2))))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    void 존재하지_않는_모집_직무는_등록과_수정에서_거절한다() {
        ProjectRequest request = baseRequestBuilder()
            .recruitmentPositions(List.of(new RecruitmentPositionDto("없는직무", 1))).build();
        User owner = owner();
        UserPrincipal principal = principal(owner.getId());
        Project project = project(owner);
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> projectService.save(request, principal))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("존재하는 모집 직무를 선택해 주세요.");
        assertThatThrownBy(() -> projectService.update(10L, request, principal))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("존재하는 모집 직무를 선택해 주세요.");
        assertThat(project.getTitle()).isEqualTo("old title");
        verify(projectRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verifyNoInteractions(objectStorageService);
    }

    @ParameterizedTest
    @CsvSource({"FRONTEND", "BACKEND", "AI", "DESIGN", "APP", "GAME", "EMBEDDED",
        "프론트엔드", "백엔드", "디자인", "앱", "게임", "임베디드", " backend "})
    void 정의된_모집_직무를_허용한다(String role) {
        assertThat(RecruitmentPositionDto.toEntities(List.of(new RecruitmentPositionDto(role, 2))))
            .singleElement().satisfies(position -> {
                assertThat(position.getRole()).isEqualTo(role.strip());
                assertThat(position.getCount()).isEqualTo(2);
            });
    }

    @Test
    void 소수_모집_인원은_JSON_변환에서_거절한다() {
        var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        assertThatThrownBy(() -> mapper.readValue(
            "{\"recruitmentPositions\":[{\"role\":\"백엔드\",\"count\":1.5}]}", ProjectRequest.class))
            .isInstanceOf(com.fasterxml.jackson.core.JsonProcessingException.class);
    }

    @Test
    void 신규_프로젝트는_모집_정보_누락과_빈_목록을_거절한다() {
        for (List<RecruitmentPositionDto> positions : java.util.Arrays.<List<RecruitmentPositionDto>>asList(null, List.of())) {
            ProjectRequest request = baseRequestBuilder().recruitmentPositions(positions).build();
            assertThatThrownBy(() -> projectService.save(request, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("모집 직무와 인원을 최소 한 개 입력해 주세요.");
        }
        verifyNoInteractions(projectRepository, userRepository, objectStorageService);
    }

    @Test
    void 신규_프로젝트는_모집_정보가_있으면_등록한다() throws Exception {
        User owner = owner();
        UserPrincipal principal = principal(owner.getId());
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        ProjectRequest request = baseRequestBuilder()
            .recruitmentPositions(List.of(new RecruitmentPositionDto("백엔드", 1))).build();

        assertThat(projectService.save(request, principal)).isEqualTo("등록되었습니다.");
        var saved = org.mockito.ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(saved.capture());
        assertThat(saved.getValue().getRecruitmentPositions()).singleElement().satisfies(position -> {
            assertThat(position.getRole()).isEqualTo("백엔드");
            assertThat(position.getCount()).isEqualTo(1);
        });
    }

    @Test
    void 기존_프로젝트는_빈_모집_목록으로_수정할_수_있다() throws Exception {
        User owner = owner();
        UserPrincipal principal = principal(owner.getId());
        Project project = project(owner);
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        assertThat(projectService.update(10L,
            baseRequestBuilder().recruitmentPositions(List.of()).build(), principal))
            .isEqualTo("수정되었습니다.");
        assertThat(project.getRecruitmentPositions()).isEmpty();
    }

    @Test
    void savesTextTeamMembersIncludingDuplicateNames() throws Exception {
        User owner = owner();
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        ProjectRequest request = baseRequestBuilder()
            .recruitmentPositions(List.of(new RecruitmentPositionDto("백엔드", 1)))
            .teamMember(List.of(
                TeamMemberDto.builder().memberName("김회원").memberRole("PM").build(),
                TeamMemberDto.builder().memberName("김회원").memberRole("Server").build()))
            .build();

        projectService.save(request, principal(1L));

        var saved = org.mockito.ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(saved.capture());
        assertThat(saved.getValue().getTeamMembers())
            .extracting(wap.web2.server.project.entity.TeamMember::getMemberName)
            .containsExactly("김회원", "김회원");
        assertThat(saved.getValue().getTeamMembers())
            .extracting(wap.web2.server.project.entity.TeamMember::getMemberRole)
            .containsExactly("PM", "Server");
    }

    @Test
    void thumbnailReplacementPreservesPreviousImageInStorage() throws Exception {
        User owner = owner();
        Project project = project(owner);
        project.updateThumbnail("https://cloud/old");
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        var file = new MockMultipartFile("thumbnail", "new.png", "image/png", new byte[] {1});
        when(objectStorageService.uploadImage("projects", "2026-01", "updated title", "thumbnail", file))
            .thenReturn("https://cloud/new");

        projectService.update(10L, baseRequestBuilder().thumbnailFiles(file).build(), principal(1L));

        assertThat(project.getThumbnail()).isEqualTo("https://cloud/new");
        verify(objectStorageService, never()).deleteImage(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void projectDeletionPreservesImagesAndThumbnailInStorage() {
        User owner = owner();
        Project project = project(owner);
        project.updateThumbnail("https://cloud/thumbnail");
        project.addAllImage(Image.listOf(List.of("https://cloud/image")));
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(projectRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(project));

        projectService.delete(10L, principal(1L));

        verify(projectRepository).delete(project);
        verifyNoInteractions(objectStorageService);
    }

    @Test
    void votingProjectsCannotBeDeletedEvenByOwner() {
        User owner = owner();
        Project project = project(owner);
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(projectRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(project));
        when(projectRepository.participatesInVote(10L)).thenReturn(true);
        assertThatThrownBy(() -> projectService.delete(10L, principal(1L)))
            .isInstanceOf(wap.web2.server.exception.ConflictException.class);
        verify(projectRepository, never()).delete(project);
    }

    private ProjectRequest.ProjectRequestBuilder baseRequestBuilder() {
        return ProjectRequest.builder()
            .title("updated title")
            .projectType("WEB")
            .content("updated content")
            .summary("updated summary")
            .password("pw")
            .teamMember(
                List.of(TeamMemberDto.builder().memberName("member").memberRole("backend").build())
            )
            .techStack(
                List.of(
                    TechStackDto.builder().techStackName("Spring").techStackType("BACKEND").build()
                )
            );
    }

    private User owner() {
        User user = new User();
        user.setId(1L);
        user.setName("owner");
        user.setRole(Role.ROLE_MEMBER);
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
