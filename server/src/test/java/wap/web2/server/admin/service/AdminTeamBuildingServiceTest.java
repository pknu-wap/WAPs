package wap.web2.server.admin.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wap.web2.server.admin.entity.TeamBuildingMeta;
import wap.web2.server.admin.entity.TeamBuildingStatus;
import wap.web2.server.admin.repository.TeamBuildingMetaRepository;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.teambuild.repository.ProjectApplyRepository;
import wap.web2.server.teambuild.repository.ProjectRecruitRepository;
import wap.web2.server.teambuild.repository.TeamRepository;
import wap.web2.server.teambuild.service.TeamBuilder;
import wap.web2.server.util.SemesterGenerator;

@ExtendWith(MockitoExtension.class)
class AdminTeamBuildingServiceTest {

    @Mock
    TeamBuildingMetaRepository teamBuildingMetaRepository;
    @Mock
    ProjectRecruitRepository recruitRepository;
    @Mock
    ProjectApplyRepository applyRepository;
    @Mock
    ProjectRepository projectRepository;
    @Mock
    TeamRepository teamRepository;
    @Mock
    TeamBuilder teamBuilder;

    @InjectMocks
    AdminTeamBuildingService adminTeamBuildingService;

    @Test
    void 팀빌딩_실행이_성공하면_라운드가_증가하고_상태가_OPEN으로_리셋된다() {
        // given
        TeamBuildingMeta meta = new TeamBuildingMeta(null, SemesterGenerator.generateSemester(), TeamBuildingStatus.CLOSED, 1);
        when(teamBuildingMetaRepository.findBySemester(any())).thenReturn(Optional.of(meta));

        when(projectRepository.findProjectsBySemester(any())).thenReturn(List.of());
        when(applyRepository.findAllBySemesterAndPosition(any(), any())).thenReturn(List.of());

        // when
        adminTeamBuildingService.makeTeam();

        // then
        assertThat(meta.getRound()).isEqualTo(2);
        assertThat(meta.getStatus()).isEqualTo(TeamBuildingStatus.OPEN);
        verify(teamRepository).saveAll(any());
    }

}
