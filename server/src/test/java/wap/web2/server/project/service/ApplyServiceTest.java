package wap.web2.server.project.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.dto.request.ProjectApplyRequest;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.entity.ProjectApply;
import wap.web2.server.project.repository.ProjectApplyRepository;
import wap.web2.server.project.repository.ProjectRepository;

@ExtendWith(MockitoExtension.class)
class ApplyServiceTest {

    @Mock
    UserRepository userRepository;
    @Mock
    ProjectRepository projectRepository;
    @Mock
    ProjectApplyRepository applyRepository;

    @InjectMocks
    ApplyService applyService;

    @Test
    void 지원서의_priority는_담긴순서대로_1부터_차례대로_증가한다() {
        // given
        UserPrincipal principal = mock(UserPrincipal.class);
        when(principal.getId()).thenReturn(1L);
        when(principal.getName()).thenReturn("tester");

        User user = new User();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        Project p1 = Project.builder().projectId(10L).title("A").build();
        Project p2 = Project.builder().projectId(20L).title("B").build();
        Project p3 = Project.builder().projectId(30L).title("C").build();
        when(projectRepository.findById(10L)).thenReturn(Optional.of(p1));
        when(projectRepository.findById(20L)).thenReturn(Optional.of(p2));
        when(projectRepository.findById(30L)).thenReturn(Optional.of(p3));

        ProjectApplyRequest request = new ProjectApplyRequest(
                List.of(
                        new ProjectApplyRequest.Apply(10L, "BE", "열심히할게요."),
                        new ProjectApplyRequest.Apply(20L, "FE", "열심히할게요."),
                        new ProjectApplyRequest.Apply(30L, "AI", "열심히할게요.")
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

}
