package wap.web2.server.admin.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.teambuild.dto.TeamMemberResult;
import wap.web2.server.teambuild.dto.response.TeamBuildingResult;
import wap.web2.server.teambuild.dto.response.TeamBuildingResults;
import wap.web2.server.teambuild.entity.Field;
import wap.web2.server.teambuild.entity.Position;
import wap.web2.server.teambuild.entity.Team;
import wap.web2.server.teambuild.repository.TeamRepository;
import wap.web2.server.teambuild.service.TeamBuildingResultService;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UnassignedMemberAssignerTest {

    private static final String SEMESTER = "2026-01";

    @Mock
    private TeamBuildingResultService teamBuildingResultService;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UnassignedMemberAssigner unassignedMemberAssigner;

    @Test
    @DisplayName("미배정자가 없으면 아무 일도 하지 않는다")
    void noOp_whenNoUnassigned() {
        when(teamBuildingResultService.getResults()).thenReturn(new TeamBuildingResults());
        when(teamBuildingResultService.getUnassignedMembers(any())).thenReturn(List.of());

        unassignedMemberAssigner.assign(SEMESTER);

        verify(teamRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("3명 이하 단일 분야는 팀원 수가 적은 기존 팀부터 채운다")
    void distributeToExistingTeams_whenBelowThreshold() {
        // given: 미배정자 3명 (모두 BACKEND → WEB)
        TeamBuildingResults results = resultsWithAllocated();
        when(teamBuildingResultService.getResults()).thenReturn(results);

        TeamMemberResult m1 = unassigned(11L, Position.BACKEND);
        TeamMemberResult m2 = unassigned(12L, Position.BACKEND);
        TeamMemberResult m3 = unassigned(13L, Position.BACKEND);
        when(teamBuildingResultService.getUnassignedMembers(any()))
                .thenReturn(List.of(m1, m2, m3));

        // primaryPosition 동기화된 사용자
        when(userRepository.findAllById(any())).thenReturn(List.of(
                user(11L, Position.BACKEND),
                user(12L, Position.BACKEND),
                user(13L, Position.BACKEND)
        ));

        // 기존 WEB 팀 2개: project 100(2명), project 200(3명)
        when(teamRepository.findAllBySemester(SEMESTER)).thenReturn(List.of(
                team(1L, 100L, Position.FRONTEND),
                team(2L, 100L, Position.BACKEND),
                team(3L, 200L, Position.BACKEND),
                team(4L, 200L, Position.BACKEND),
                team(5L, 200L, Position.BACKEND)
        ));
        when(projectRepository.findById(100L)).thenReturn(Optional.of(project(100L, "WEB")));
        when(projectRepository.findById(200L)).thenReturn(Optional.of(project(200L, "WEB")));

        when(teamRepository.countMembersByProject(SEMESTER)).thenReturn(List.of(
                count(100L, 2L),
                count(200L, 3L)
        ));

        // when
        unassignedMemberAssigner.assign(SEMESTER);

        // then
        ArgumentCaptor<List<Team>> captor = ArgumentCaptor.forClass(List.class);
        verify(teamRepository, times(1)).saveAll(captor.capture());

        List<Team> saved = captor.getValue();
        assertThat(saved).hasSize(3);
        // 적은 팀(project 100) → 그다음 적은 팀(project 100) → project 200 (round-robin)
        assertThat(saved.get(0).getProjectId()).isEqualTo(100L);
        assertThat(saved.get(0).getField()).isNull();
        assertThat(saved.get(1).getProjectId()).isEqualTo(100L);
        assertThat(saved.get(2).getProjectId()).isEqualTo(200L);
        assertThat(saved).allMatch(t -> t.getLeaderId() != null);
        assertThat(saved).allMatch(t -> t.getSemester().equals(SEMESTER));
    }

    @Test
    @DisplayName("4명 단일 분야는 4인 신규 팀 1개를 만든다 (projectId/leaderId null)")
    void formNewTeams_whenExactlyFour() {
        TeamBuildingResults results = resultsWithAllocated();
        when(teamBuildingResultService.getResults()).thenReturn(results);

        TeamMemberResult m1 = unassigned(11L, Position.BACKEND);
        TeamMemberResult m2 = unassigned(12L, Position.BACKEND);
        TeamMemberResult m3 = unassigned(13L, Position.BACKEND);
        TeamMemberResult m4 = unassigned(14L, Position.BACKEND);
        when(teamBuildingResultService.getUnassignedMembers(any()))
                .thenReturn(List.of(m1, m2, m3, m4));

        when(userRepository.findAllById(any())).thenReturn(List.of(
                user(11L, Position.BACKEND),
                user(12L, Position.BACKEND),
                user(13L, Position.BACKEND),
                user(14L, Position.BACKEND)
        ));

        when(teamRepository.findAllBySemester(SEMESTER)).thenReturn(List.of());
        when(teamRepository.countMembersByProject(SEMESTER)).thenReturn(List.of());

        unassignedMemberAssigner.assign(SEMESTER);

        ArgumentCaptor<List<Team>> captor = ArgumentCaptor.forClass(List.class);
        verify(teamRepository).saveAll(captor.capture());
        List<Team> saved = captor.getValue();
        assertThat(saved).hasSize(4);
        assertThat(saved).allMatch(t -> t.getProjectId() == null);
        assertThat(saved).allMatch(t -> t.getLeaderId() == null);
        assertThat(saved).allMatch(t -> t.getField() == Field.WEB);
    }

    @Test
    @DisplayName("5명 단일 분야는 신규 팀 4명 + 나머지 1명을 기존 팀에 배치")
    void splitIntoNewTeamAndDistributeRemainder() {
        TeamBuildingResults results = resultsWithAllocated();
        when(teamBuildingResultService.getResults()).thenReturn(results);

        TeamMemberResult m1 = unassigned(11L, Position.BACKEND);
        TeamMemberResult m2 = unassigned(12L, Position.BACKEND);
        TeamMemberResult m3 = unassigned(13L, Position.BACKEND);
        TeamMemberResult m4 = unassigned(14L, Position.BACKEND);
        TeamMemberResult m5 = unassigned(15L, Position.BACKEND);
        when(teamBuildingResultService.getUnassignedMembers(any()))
                .thenReturn(List.of(m1, m2, m3, m4, m5));

        when(userRepository.findAllById(any())).thenReturn(List.of(
                user(11L, Position.BACKEND),
                user(12L, Position.BACKEND),
                user(13L, Position.BACKEND),
                user(14L, Position.BACKEND),
                user(15L, Position.BACKEND)
        ));

        // 기존 WEB 팀 1개: project 100 (1명)
        when(teamRepository.findAllBySemester(SEMESTER)).thenReturn(List.of(
                team(1L, 100L, Position.BACKEND)
        ));
        when(projectRepository.findById(100L)).thenReturn(Optional.of(project(100L, "WEB")));
        when(teamRepository.countMembersByProject(SEMESTER)).thenReturn(List.of(count(100L, 1L)));

        unassignedMemberAssigner.assign(SEMESTER);

        ArgumentCaptor<List<Team>> captor = ArgumentCaptor.forClass(List.class);
        verify(teamRepository).saveAll(captor.capture());
        List<Team> saved = captor.getValue();
        assertThat(saved).hasSize(5);

        long newTeamCount = saved.stream().filter(t -> t.getField() == Field.WEB && t.getProjectId() == null).count();
        long addedToExisting = saved.stream().filter(t -> t.getProjectId() != null && t.getProjectId().equals(100L)).count();

        assertThat(newTeamCount).isEqualTo(4);
        assertThat(addedToExisting).isEqualTo(1);
    }

    @Test
    @DisplayName("8명 단일 분야는 신규 팀 2개")
    void formMultipleNewTeams() {
        TeamBuildingResults results = resultsWithAllocated();
        when(teamBuildingResultService.getResults()).thenReturn(results);

        List<TeamMemberResult> eight = List.of(
                unassigned(11L, Position.BACKEND),
                unassigned(12L, Position.BACKEND),
                unassigned(13L, Position.BACKEND),
                unassigned(14L, Position.BACKEND),
                unassigned(15L, Position.BACKEND),
                unassigned(16L, Position.BACKEND),
                unassigned(17L, Position.BACKEND),
                unassigned(18L, Position.BACKEND)
        );
        when(teamBuildingResultService.getUnassignedMembers(any())).thenReturn(eight);

        when(userRepository.findAllById(any())).thenReturn(eight.stream()
                .map(m -> user(m.getId(), Position.BACKEND)).toList());

        when(teamRepository.findAllBySemester(SEMESTER)).thenReturn(List.of());
        when(teamRepository.countMembersByProject(SEMESTER)).thenReturn(List.of());

        unassignedMemberAssigner.assign(SEMESTER);

        ArgumentCaptor<List<Team>> captor = ArgumentCaptor.forClass(List.class);
        verify(teamRepository).saveAll(captor.capture());
        List<Team> saved = captor.getValue();
        assertThat(saved).hasSize(8);
        assertThat(saved).allMatch(t -> t.getField() == Field.WEB);
        assertThat(saved).allMatch(t -> t.getProjectId() == null);
    }

    @Test
    @DisplayName("9명 단일 분야는 신규 팀 2개 + 나머지 1명 기존 팀 배치")
    void splitWithNineMembers() {
        TeamBuildingResults results = resultsWithAllocated();
        when(teamBuildingResultService.getResults()).thenReturn(results);

        List<TeamMemberResult> nine = List.of(
                unassigned(11L, Position.BACKEND),
                unassigned(12L, Position.BACKEND),
                unassigned(13L, Position.BACKEND),
                unassigned(14L, Position.BACKEND),
                unassigned(15L, Position.BACKEND),
                unassigned(16L, Position.BACKEND),
                unassigned(17L, Position.BACKEND),
                unassigned(18L, Position.BACKEND),
                unassigned(19L, Position.BACKEND)
        );
        when(teamBuildingResultService.getUnassignedMembers(any())).thenReturn(nine);

        when(userRepository.findAllById(any())).thenReturn(nine.stream()
                .map(m -> user(m.getId(), Position.BACKEND)).toList());

        when(teamRepository.findAllBySemester(SEMESTER)).thenReturn(List.of(
                team(1L, 100L, Position.BACKEND)
        ));
        when(projectRepository.findById(100L)).thenReturn(Optional.of(project(100L, "WEB")));
        when(teamRepository.countMembersByProject(SEMESTER)).thenReturn(List.of(count(100L, 1L)));

        unassignedMemberAssigner.assign(SEMESTER);

        ArgumentCaptor<List<Team>> captor = ArgumentCaptor.forClass(List.class);
        verify(teamRepository).saveAll(captor.capture());
        List<Team> saved = captor.getValue();
        assertThat(saved).hasSize(9);
        long newTeamCount = saved.stream().filter(t -> t.getProjectId() == null).count();
        assertThat(newTeamCount).isEqualTo(8);
    }

    @Test
    @DisplayName("분야별로 분리하여 처리한다 (웹 4 + 앱 2)")
    void bucketByFieldAndProcessIndependently() {
        TeamBuildingResults results = resultsWithAllocated();
        when(teamBuildingResultService.getResults()).thenReturn(results);

        List<TeamMemberResult> members = List.of(
                unassigned(11L, Position.BACKEND),
                unassigned(12L, Position.BACKEND),
                unassigned(13L, Position.BACKEND),
                unassigned(14L, Position.BACKEND),
                unassigned(21L, Position.APP),
                unassigned(22L, Position.APP)
        );
        when(teamBuildingResultService.getUnassignedMembers(any())).thenReturn(members);

        when(userRepository.findAllById(any())).thenReturn(members.stream()
                .map(m -> user(m.getId(), m.getPosition())).toList());

        // 기존 APP 팀 1개: project 300 (1명)
        when(teamRepository.findAllBySemester(SEMESTER)).thenReturn(List.of(
                team(99L, 300L, Position.APP)
        ));
        when(projectRepository.findById(300L)).thenReturn(Optional.of(project(300L, "APP")));
        when(teamRepository.countMembersByProject(SEMESTER)).thenReturn(List.of(count(300L, 1L)));

        unassignedMemberAssigner.assign(SEMESTER);

        ArgumentCaptor<List<Team>> captor = ArgumentCaptor.forClass(List.class);
        verify(teamRepository).saveAll(captor.capture());
        List<Team> saved = captor.getValue();
        assertThat(saved).hasSize(6);

        long webNewTeam = saved.stream()
                .filter(t -> t.getField() == Field.WEB && t.getProjectId() == null)
                .count();
        long appAdded = saved.stream()
                .filter(t -> t.getProjectId() != null && t.getProjectId().equals(300L))
                .count();

        assertThat(webNewTeam).isEqualTo(4);
        assertThat(appAdded).isEqualTo(2);
    }

    @Test
    @DisplayName("primaryPosition이 null이면 TeamMemberResult의 position으로 fallback")
    void fallbackWhenPrimaryPositionNull() {
        TeamBuildingResults results = resultsWithAllocated();
        when(teamBuildingResultService.getResults()).thenReturn(results);

        // primaryPosition이 null인 사용자
        TeamMemberResult m1 = unassigned(11L, Position.GAME);
        when(teamBuildingResultService.getUnassignedMembers(any())).thenReturn(List.of(m1));

        User noPrimary = user(11L, null);
        when(userRepository.findAllById(any())).thenReturn(List.of(noPrimary));

        when(teamRepository.findAllBySemester(SEMESTER)).thenReturn(List.of());
        when(teamRepository.countMembersByProject(SEMESTER)).thenReturn(List.of());

        unassignedMemberAssigner.assign(SEMESTER);

        ArgumentCaptor<List<Team>> captor = ArgumentCaptor.forClass(List.class);
        verify(teamRepository).saveAll(captor.capture());
        List<Team> saved = captor.getValue();
        assertThat(saved).hasSize(1);
        assertThat(saved.get(0).getField()).isEqualTo(Field.GAME);
    }

    @Test
    @DisplayName("primaryPosition이 null + TeamMemberResult의 position이 null이면 WEB fallback")
    void fallbackToWebWhenNoPosition() {
        TeamBuildingResults results = resultsWithAllocated();
        when(teamBuildingResultService.getResults()).thenReturn(results);

        TeamMemberResult m1 = unassigned(11L, null);
        when(teamBuildingResultService.getUnassignedMembers(any())).thenReturn(List.of(m1));

        when(userRepository.findAllById(any())).thenReturn(List.of(user(11L, null)));

        when(teamRepository.findAllBySemester(SEMESTER)).thenReturn(List.of());
        when(teamRepository.countMembersByProject(SEMESTER)).thenReturn(List.of());

        unassignedMemberAssigner.assign(SEMESTER);

        ArgumentCaptor<List<Team>> captor = ArgumentCaptor.forClass(List.class);
        verify(teamRepository).saveAll(captor.capture());
        List<Team> saved = captor.getValue();
        assertThat(saved.get(0).getField()).isEqualTo(Field.WEB);
    }

    private TeamBuildingResults resultsWithAllocated() {
        return new TeamBuildingResults();
    }

    private TeamMemberResult unassigned(Long id, Position position) {
        return TeamMemberResult.builder()
                .id(id)
                .name("user-" + id)
                .position(position)
                .build();
    }

    private User user(Long id, Position primaryPosition) {
        User u = new User();
        u.setId(id);
        u.setName("user-" + id);
        u.setPrimaryPosition(primaryPosition);
        return u;
    }

    private Team team(Long memberId, Long projectId, Position position) {
        return Team.builder()
                .memberId(memberId)
                .projectId(projectId)
                .leaderId(projectId + 1000L)
                .position(position)
                .semester(SEMESTER)
                .build();
    }

    private Project project(Long id, String projectType) {
        return Project.builder()
                .projectId(id)
                .title("p-" + id)
                .projectType(projectType)
                .build();
    }

    private TeamRepository.TeamMemberCount count(Long projectId, Long memberCount) {
        return new TeamRepository.TeamMemberCount() {
            @Override
            public Long getProjectId() {
                return projectId;
            }

            @Override
            public Long getMemberCount() {
                return memberCount;
            }
        };
    }
}