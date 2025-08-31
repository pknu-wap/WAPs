package wap.web2.server.teambuild.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.teambuild.dto.ApplyInfo;
import wap.web2.server.teambuild.dto.RecruitInfo;
import wap.web2.server.teambuild.entity.ProjectApply;
import wap.web2.server.teambuild.repository.ProjectApplyRepository;
import wap.web2.server.teambuild.repository.ProjectRecruitRepository;
import wap.web2.server.teambuild.repository.ProjectRecruitWishRepository;
import wap.web2.server.teambuild.service.impl.TeamBuilderImpl;

@Service
@RequiredArgsConstructor
public class TeamBuildService {

    private final ProjectRecruitWishRepository recruitWishRepository;
    private final ProjectRecruitRepository recruitRepository;
    private final ProjectApplyRepository applyRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    // TODO: 리턴값 고민
    public void makeTeam(UserPrincipal userPrincipal) {
        Map<Long, List<ApplyInfo>> applyMap = getApplyMap();
        Map<Long, RecruitInfo> RecruitMap = getRecruitMap();

        TeamBuilder teamBuilder = new TeamBuilderImpl();

        return;
    }

    private Map<Long, List<ApplyInfo>> getApplyMap() {
        Map<Long, List<ApplyInfo>> applyMap = new HashMap<>();

        List<ProjectApply> applyEntities = applyRepository.findAll();
        for (ProjectApply applyEntity : applyEntities) {
            long projectId = applyEntity.getProject().getProjectId();
            applyMap.computeIfAbsent(projectId, key -> new ArrayList<>())
                    .add(ApplyInfo.builder()
                            .userId(applyEntity.getUser().getId())
                            .projectId(projectId)
                            .priority(applyEntity.getPriority())
                            .position(applyEntity.getPosition())
                            .build()
                    );
        }

        return applyMap;
    }

    private Map<Long, RecruitInfo> getRecruitMap() {

    }

}
