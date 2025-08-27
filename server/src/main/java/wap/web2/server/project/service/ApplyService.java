package wap.web2.server.project.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.dto.request.ProjectApplyRequest;
import wap.web2.server.project.dto.request.ProjectApplyRequest.Apply;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.entity.ProjectApply;
import wap.web2.server.project.repository.ProjectApplyRepository;
import wap.web2.server.project.repository.ProjectRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplyService {

    private final ProjectApplyRepository applyRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public void apply(UserPrincipal userPrincipal, ProjectApplyRequest request) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));

        // TODO: 이미 신청한 사용자 처리

        List<Apply> applies = request.getApplies();
        int priority = 1; // 우선순위는 1-based
        for (Apply apply : applies) {
            Project project = projectRepository.findById(apply.getProjectId())
                    .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 프로젝트입니다."));
            log.info("apply-user:{},priority:{},project:{}", userPrincipal.getName(), priority, project.getTitle());

            applyRepository.save(
                    ProjectApply.builder()
                            .priority(priority++)
                            .position(apply.getPosition())
                            .comment(apply.getComment())
                            .user(user)
                            .project(project)
                            .build()
            );
        }
    }

}
