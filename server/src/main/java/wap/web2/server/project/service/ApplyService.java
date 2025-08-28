package wap.web2.server.project.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.dto.request.ProjectAppliesRequest;
import wap.web2.server.project.dto.request.ProjectAppliesRequest.ApplyRequest;
import wap.web2.server.project.dto.response.ProjectAppliesResponse;
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
    public void apply(UserPrincipal userPrincipal, ProjectAppliesRequest request) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));

        // TODO: 이미 신청한 사용자 처리

        List<ApplyRequest> applies = request.getApplies();
        int priority = 1; // 우선순위는 1-based
        for (ApplyRequest applyRequest : applies) {
            Project project = projectRepository.findById(applyRequest.getProjectId())
                    .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 프로젝트입니다."));
            log.info("apply-user:{},priority:{},project:{}", userPrincipal.getName(), priority, project.getTitle());

            applyRepository.save(
                    ProjectApply.builder()
                            .priority(priority++)
                            .position(applyRequest.getPosition())
                            .comment(applyRequest.getComment())
                            .user(user)
                            .project(project)
                            .build()
            );
        }
    }

    @Transactional(readOnly = true)
    public ProjectAppliesResponse getApplies(UserPrincipal userPrincipal, Long projectId) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 프로젝트입니다."));

        if (!project.isOwner(user)) {
            throw new IllegalArgumentException("[ERROR] 프로젝트의 팀장이 아닙니다.");
        }

        List<ProjectApply> applies = applyRepository.findAllByProject(project);
        log.info("getApplies-user:{}", user.getName());

        return ProjectAppliesResponse.fromEntities(applies);
    }

}
