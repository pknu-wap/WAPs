package wap.web2.server.teambuild.service;

import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.teambuild.dto.RecruitmentDto;
import wap.web2.server.teambuild.dto.RecruitmentDto.RecruitmentInfo;
import wap.web2.server.teambuild.dto.request.ProjectAppliesRequest;
import wap.web2.server.teambuild.dto.request.ProjectAppliesRequest.ApplyRequest;
import wap.web2.server.teambuild.dto.response.ProjectAppliesResponse;
import wap.web2.server.teambuild.entity.Position;
import wap.web2.server.teambuild.entity.ProjectApply;
import wap.web2.server.teambuild.entity.ProjectRecruit;
import wap.web2.server.teambuild.entity.ProjectRecruitWish;
import wap.web2.server.teambuild.repository.ProjectApplyRepository;
import wap.web2.server.teambuild.repository.ProjectRecruitRepository;
import wap.web2.server.teambuild.repository.ProjectRecruitWishRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplyService {

    private final ProjectRecruitWishRepository recruitWishRepository;
    private final ProjectRecruitRepository recruitRepository;
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
                            .position(Position.valueOf(applyRequest.getPosition()))
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

    // 팀장이 선호하는 지원자를 나열한 wishList 저장
    @Transactional
    public void setPreference(UserPrincipal userPrincipal, RecruitmentDto request) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 프로젝트입니다."));

        log.info("setPreference요청-user:{},project:{}", user.getId(), project.getProjectId());

        List<RecruitmentInfo> roasters = request.getRoasters();
        for (RecruitmentInfo roaster : roasters) {
            // 1. 먼저 ProjectRecruit 저장 (부모 엔티티)
            ProjectRecruit recruit = recruitRepository.save(
                    ProjectRecruit.builder()
                            .leaderId(user.getId())
                            .projectId(project.getProjectId())
                            .position(Position.valueOf(roaster.getPosition()))
                            .capacity(roaster.getCapacity())
                            .build()
            );

            // 2. 각 분야별로 우선순위 1부터 시작
            int priority = 1;
            List<ProjectRecruitWish> wishes = new ArrayList<>();
            for (long applicantId : roaster.getApplicantIds()) {
                ProjectRecruitWish wish = recruitWishRepository.save(
                        ProjectRecruitWish.builder()
                                .priority(priority++)
                                .applicantId(applicantId)
                                .recruit(recruit)
                                .build()
                );
                wishes.add(wish);
            }

            // 3. 부모 엔티티에 자식 리스트 설정
            recruit.setWishList(wishes);
        }
    }

}
