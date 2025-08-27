package wap.web2.server.project.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.dto.request.ProjectApplyRequest;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.repository.ProjectRepository;

@Service
@RequiredArgsConstructor
public class ApplyService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public void apply(UserPrincipal userPrincipal, ProjectApplyRequest request) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));

        for (Long projectId : request.getProjectIds()) {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 프로젝트입니다."));

            // TODO: apply 저장 로직 구현 user와 project를 객체로써 알고 있으니 충분
        }
    }

}
