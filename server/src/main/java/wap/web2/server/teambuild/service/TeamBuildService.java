package wap.web2.server.teambuild.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.teambuild.dto.ApplyInfo;
import wap.web2.server.teambuild.dto.RecruitInfo;
import wap.web2.server.teambuild.dto.response.TeamBuildingResults;
import wap.web2.server.teambuild.entity.ProjectApply;
import wap.web2.server.teambuild.entity.ProjectRecruit;
import wap.web2.server.teambuild.entity.ProjectRecruitWish;
import wap.web2.server.teambuild.repository.ProjectApplyRepository;
import wap.web2.server.teambuild.repository.ProjectRecruitRepository;
import wap.web2.server.teambuild.service.impl.TeamBuilderImpl;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamBuildService {

    private final ProjectRecruitRepository recruitRepository;
    private final ProjectApplyRepository applyRepository;

    // TODO: 리턴값 고민
    public TeamBuildingResults makeTeam(UserPrincipal userPrincipal) {
        Map<Long, List<ApplyInfo>> applyMap = getApplyMap();
        Map<Long, RecruitInfo> recruitMap = getRecruitMap();

        TeamBuilder teamBuilder = new TeamBuilderImpl();
        Map<Long, List<Long>> allocated = teamBuilder.allocate(applyMap, recruitMap);

        // allocated를 로깅한다. (테스트 용도)
        for (Map.Entry<Long, List<Long>> entry : allocated.entrySet()) {
            log.info("[TEAMBUILD] projectId:{}", entry.getKey());
            log.info("[TEAMBUILD] memberIds:{}", entry.getValue());
        }

        return TeamBuildingResults.from(allocated);
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
        Map<Long, RecruitInfo> recruitMap = new HashMap<>();

        List<ProjectRecruit> recruitEntities = recruitRepository.findAll();
        for (ProjectRecruit recruitEntity : recruitEntities) {
            long projectId = recruitEntity.getProjectId();
            List<Long> userIds = new ArrayList<>();
            for (ProjectRecruitWish wishEntity : recruitEntity.getWishList()) {
                userIds.add(wishEntity.getApplicantId());
            }

            recruitMap.put(projectId, RecruitInfo.builder()
                    .leaderId(recruitEntity.getLeaderId())
                    .projectId(projectId)
                    .position(recruitEntity.getPosition())
                    .capacity(recruitEntity.getCapacity())
                    .userIds(userIds)
                    .build()
            );
        }

        return recruitMap;
    }

}
