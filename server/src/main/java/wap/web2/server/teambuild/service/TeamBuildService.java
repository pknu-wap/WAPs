package wap.web2.server.teambuild.service;

import static wap.web2.server.util.SemesterGenerator.generateSemester;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.teambuild.dto.ApplyInfo;
import wap.web2.server.teambuild.dto.RecruitInfo;
import wap.web2.server.teambuild.entity.Position;
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
    public void makeTeam(UserPrincipal userPrincipal) {
        // TODO: ADMIN만 관리가능하도록?
        TeamBuilder teamBuilder = new TeamBuilderImpl();

        // Map<projectId, Map<position, Set<userId>>>
        Map<Long, Map<Position, Set<Long>>> results = new HashMap<>();
        for (Position position : Position.values()) {
            Map<Long, List<ApplyInfo>> applyMap = getApplyMap(position);
            Map<Long, RecruitInfo> recruitMap = getRecruitMap(position);
            Map<Long, Set<Long>> allocated = teamBuilder.allocate(applyMap, recruitMap);

            // Map<projectId, Set<userId>> -> Map<projectId, Map<position, Set<userId>>>
            for (Entry<Long, Set<Long>> entry : allocated.entrySet()) {
                long projectId = entry.getKey();
                Set<Long> userIds = entry.getValue();

                // 프로젝트별 Position Map (EnumMap 메모리/성능 유리)
                Map<Position, Set<Long>> byPosition
                        = results.computeIfAbsent(projectId, k -> new EnumMap<>(Position.class));

                // 해당 포지션의 사용자 집합 확보 후 추가
                Set<Long> members = byPosition.computeIfAbsent(position, k -> new HashSet<>());
                members.addAll(userIds);
            }
        }

        saveTeamBuildingResults(results);
    }

    // TODO: 내부 객체에 position 빼기
    private Map<Long, List<ApplyInfo>> getApplyMap(Position pos) {
        Map<Long, List<ApplyInfo>> applyMap = new HashMap<>();

        List<ProjectApply> applyEntities = applyRepository.findAllBySemesterAndPosition(generateSemester(), pos);
        for (ProjectApply applyEntity : applyEntities) {
            long projectId = applyEntity.getProject().getProjectId();
            List<ApplyInfo> applyInfos = applyMap.computeIfAbsent(projectId, key -> new ArrayList<>());
            applyInfos.add(ApplyInfo.builder()
                    .userId(applyEntity.getUser().getId())
                    .projectId(projectId)
                    .priority(applyEntity.getPriority())
                    .position(applyEntity.getPosition())
                    .build()
            );
        }

        return applyMap;
    }

    private Map<Long, RecruitInfo> getRecruitMap(Position pos) {
        Map<Long, RecruitInfo> recruitMap = new HashMap<>();

        List<ProjectRecruit> recruitEntities = recruitRepository.findAllBySemesterAndPosition(generateSemester(), pos);
        for (ProjectRecruit recruitEntity : recruitEntities) {
            long projectId = recruitEntity.getProjectId();
            Set<Long> userIds = new HashSet<>();
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

    private void saveTeamBuildingResults(Map<Long, Map<Position, Set<Long>>> results) {

        // repository.save();
    }

}
