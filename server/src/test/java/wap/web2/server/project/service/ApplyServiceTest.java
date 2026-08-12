package wap.web2.server.project.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wap.web2.server.admin.entity.TeamBuildingMeta;
import wap.web2.server.admin.entity.TeamBuildingStatus;
import wap.web2.server.admin.repository.TeamBuildingMetaRepository;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.exception.ForbiddenException;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.teambuild.dto.RecruitmentDto;
import wap.web2.server.teambuild.dto.RecruitmentDto.RecruitmentInfo;
import wap.web2.server.teambuild.dto.request.ProjectAppliesRequest;
import wap.web2.server.teambuild.dto.request.ProjectAppliesRequest.ApplyRequest;
import wap.web2.server.teambuild.entity.Position;
import wap.web2.server.teambuild.entity.ProjectApply;
import wap.web2.server.teambuild.entity.ProjectRecruit;
import wap.web2.server.teambuild.entity.ProjectRecruitWish;
import wap.web2.server.teambuild.repository.ProjectApplyRepository;
import wap.web2.server.teambuild.repository.ProjectRecruitRepository;
import wap.web2.server.teambuild.repository.ProjectRecruitWishRepository;
import wap.web2.server.teambuild.service.ApplyService;
import wap.web2.server.util.SemesterGenerator;

@ExtendWith(MockitoExtension.class)
class ApplyServiceTest {

    @Mock
    UserRepository userRepository;
    @Mock
    ProjectRepository projectRepository;
    @Mock
    ProjectApplyRepository applyRepository;
    @Mock
    TeamBuildingMetaRepository teamBuildingMetaRepository;
    @Mock
    ProjectRecruitRepository recruitRepository;
    @Mock
    ProjectRecruitWishRepository recruitWishRepository;

    @InjectMocks
    ApplyService applyService;

    @Test
    void 지원서의_priority는_담긴순서대로_1부터_차례대로_증가한다() {
        // given
        UserPrincipal principal = mock(UserPrincipal.class);
        when(principal.getId()).thenReturn(1L);
        when(principal.getName()).thenReturn("tester");

        TeamBuildingMeta meta = new TeamBuildingMeta(null, SemesterGenerator.generateSemester(), TeamBuildingStatus.APPLY, 1);
        when(teamBuildingMetaRepository.findBySemester(any())).thenReturn(Optional.of(meta));

        User user = new User();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        Project p1 = Project.builder().projectId(10L).title("A").build();
        Project p2 = Project.builder().projectId(20L).title("B").build();
        Project p3 = Project.builder().projectId(30L).title("C").build();
        when(projectRepository.findById(10L)).thenReturn(Optional.of(p1));
        when(projectRepository.findById(20L)).thenReturn(Optional.of(p2));
        when(projectRepository.findById(30L)).thenReturn(Optional.of(p3));

        ProjectAppliesRequest request = new ProjectAppliesRequest(
                List.of(
                        new ApplyRequest(10L, Position.BACKEND.name(), "열심히할게요."),
                        new ApplyRequest(20L, Position.FRONTEND.name(), "열심히할게요."),
                        new ApplyRequest(30L, Position.AI.name(), "열심히할게요.")
                )
        );

        // when
        applyService.apply(principal, request);

        // then
        ArgumentCaptor<ProjectApply> captor = ArgumentCaptor.forClass(ProjectApply.class);
        verify(applyRepository, times(3)).save(captor.capture());

        List<ProjectApply> saved = captor.getAllValues();
        assertThat(saved).extracting(ProjectApply::getPriority)
                .containsExactly(1, 2, 3); // 순서대로 증가했는지 체크
    }

    @Test
    void 해당_프로젝트_팀장이_아닌_인원은_지원을_열람할_수_없다() {
        // given
        UserPrincipal principal = mock(UserPrincipal.class);
        when(principal.getId()).thenReturn(2L);
        // when(principal.getName()).thenReturn("!Owner"); 사용하지 않는 스텁을 남기면 오류가 납니다.. 학습용으로 놔둘게요.

        User owner = new User();
        owner.setId(1L);
        User other = new User();
        other.setId(2L);
        // when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(userRepository.findById(2L)).thenReturn(Optional.of(other));

        Project project = Project.builder()
                .projectId(1L)
                .title("테스트프로젝트")
                .user(owner)
                .build();
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        // when & then
        assertThatThrownBy(() -> applyService.getApplies(principal, 1L))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void 제1차_팀빌딩에서_지원자가_4명_이상인_프로젝트는_4명_이상에게_우선순위를_매기면_제출할_수_있다() {
        // given
        UserPrincipal principal = stubLeaderPrincipal();
        Project project = stubLeaderContext(principal, 1);
        stubApplicants(project, 5);
        RecruitmentDto request = new RecruitmentDto(
                1L,
                List.of(
                        new RecruitmentInfo(2, Position.BACKEND.name(), List.of(1L, 2L)),
                        new RecruitmentInfo(2, Position.FRONTEND.name(), List.of(3L, 4L))
                )
        );

        // when & then
        assertDoesNotThrow(() -> applyService.setPreference(principal, request));
        verify(recruitWishRepository, times(4)).save(any(ProjectRecruitWish.class));
    }

    @Test
    void 제1차_팀빌딩에서_지원자가_4명_이상인_프로젝트에_3명_이하로만_우선순위를_매기면_예외가_발생한다() {
        // given
        UserPrincipal principal = stubLeaderPrincipal();
        Project project = stubLeaderContext(principal, 1);
        stubApplicants(project, 5);
        RecruitmentDto request = new RecruitmentDto(
                1L,
                List.of(
                        new RecruitmentInfo(2, Position.BACKEND.name(), List.of(1L, 2L, 3L)),
                        new RecruitmentInfo(0, Position.FRONTEND.name(), List.of())
                )
        );

        // when & then
        assertThatThrownBy(() -> applyService.setPreference(principal, request))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void 제1차_팀빌딩에서_지원자가_4명_미만인_프로젝트는_전원에게_우선순위를_매기면_제출할_수_있다() {
        // given
        UserPrincipal principal = stubLeaderPrincipal();
        Project project = stubLeaderContext(principal, 1);
        stubApplicants(project, 3);
        RecruitmentDto request = new RecruitmentDto(
                1L,
                List.of(new RecruitmentInfo(2, Position.BACKEND.name(), List.of(1L, 2L, 3L)))
        );

        // when & then
        assertDoesNotThrow(() -> applyService.setPreference(principal, request));
        verify(recruitWishRepository, times(3)).save(any(ProjectRecruitWish.class));
    }

    @Test
    void 제1차_팀빌딩에서_지원자가_4명_미만인_프로젝트에_일부만_우선순위를_매기면_예외가_발생한다() {
        // given
        UserPrincipal principal = stubLeaderPrincipal();
        Project project = stubLeaderContext(principal, 1);
        stubApplicants(project, 3);
        RecruitmentDto request = new RecruitmentDto(
                1L,
                List.of(new RecruitmentInfo(2, Position.BACKEND.name(), List.of(1L, 2L)))
        );

        // when & then
        assertThatThrownBy(() -> applyService.setPreference(principal, request))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void 모든_포지션의_capacity가_0이면_우선순위를_매기지_않아도_제출할_수_있다() {
        // given
        UserPrincipal principal = stubLeaderPrincipal();
        Project project = stubLeaderContext(principal, 1);
        stubApplicants(project, 5);
        RecruitmentDto request = new RecruitmentDto(
                1L,
                List.of(
                        new RecruitmentInfo(0, Position.BACKEND.name(), List.of()),
                        new RecruitmentInfo(0, Position.FRONTEND.name(), List.of())
                )
        );

        // when & then
        assertDoesNotThrow(() -> applyService.setPreference(principal, request));
    }

    @Test
    void 제2차_팀빌딩에서_지원자_일부에게만_우선순위를_매기면_예외가_발생한다() {
        // given
        UserPrincipal principal = stubLeaderPrincipal();
        Project project = stubLeaderContext(principal, 2);
        stubApplicants(project, 5);
        RecruitmentDto request = new RecruitmentDto(
                1L,
                List.of(new RecruitmentInfo(2, Position.BACKEND.name(), List.of(1L, 2L, 3L, 4L)))
        );

        // when & then
        assertThatThrownBy(() -> applyService.setPreference(principal, request))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void 제2차_팀빌딩에서_모든_지원자에게_우선순위를_매기면_제출할_수_있다() {
        // given
        UserPrincipal principal = stubLeaderPrincipal();
        Project project = stubLeaderContext(principal, 2);
        stubApplicants(project, 5);
        RecruitmentDto request = new RecruitmentDto(
                1L,
                List.of(new RecruitmentInfo(2, Position.BACKEND.name(), List.of(1L, 2L, 3L, 4L, 5L)))
        );

        // when & then
        assertDoesNotThrow(() -> applyService.setPreference(principal, request));
        verify(recruitWishRepository, times(5)).save(any(ProjectRecruitWish.class));
    }

    private UserPrincipal stubLeaderPrincipal() {
        UserPrincipal principal = mock(UserPrincipal.class);
        when(principal.getId()).thenReturn(1L);
        return principal;
    }

    private Project stubLeaderContext(UserPrincipal principal, int round) {
        User leader = new User();
        leader.setId(principal.getId());
        when(userRepository.findById(1L)).thenReturn(Optional.of(leader));

        Project project = Project.builder()
                .projectId(1L)
                .title("테스트프로젝트")
                .user(leader)
                .build();
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        TeamBuildingMeta meta = new TeamBuildingMeta(null, SemesterGenerator.generateSemester(), TeamBuildingStatus.RECRUIT, round);
        when(teamBuildingMetaRepository.findBySemester(any())).thenReturn(Optional.of(meta));

        lenient().when(recruitRepository.save(any(ProjectRecruit.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(recruitWishRepository.save(any(ProjectRecruitWish.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        return project;
    }

    private void stubApplicants(Project project, int count) {
        List<ProjectApply> applies = new ArrayList<>();
        for (long applicantId = 1; applicantId <= count; applicantId++) {
            User applicant = new User();
            applicant.setId(applicantId);
            applies.add(ProjectApply.builder()
                    .priority(1)
                    .position(Position.BACKEND)
                    .comment("열심히할게요.")
                    .user(applicant)
                    .project(project)
                    .build());
        }

        lenient().when(applyRepository.findAllByProjectAndSemester(any(), any()))
                .thenReturn(applies);
    }

}
