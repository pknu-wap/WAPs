package wap.web2.server.teambuild.service;

import static wap.web2.server.util.SemesterGenerator.generateSemester;

import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.teambuild.dto.ApplyInfo;
import wap.web2.server.teambuild.dto.RecruitInfo;
import wap.web2.server.teambuild.entity.Position;
import wap.web2.server.teambuild.entity.ProjectApply;
import wap.web2.server.teambuild.entity.ProjectRecruit;
import wap.web2.server.teambuild.entity.ProjectRecruitWish;
import wap.web2.server.teambuild.entity.Team;
import wap.web2.server.teambuild.repository.ProjectApplyRepository;
import wap.web2.server.teambuild.repository.ProjectRecruitRepository;
import wap.web2.server.teambuild.repository.TeamRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamBuildService {

    private final ProjectRecruitRepository recruitRepository;
    private final ProjectApplyRepository applyRepository;
    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;

    // TODO: TeamBuilder 의존성을 주입받도록 수정할 수 있을듯
    public void makeTeam(UserPrincipal userPrincipal) {
        // TODO: ADMIN만 관리가능하도록?
        TeamBuilder teamBuilder = new SequentialTeamBuilder();

        // Map<projectId, Map<position, Set<userId>>>
        Map<Long, Map<Position, Set<Long>>> results = new HashMap<>();
        for (Position position : Position.values()) {
            // Map<userId, List<ApplyInfo>>
            Map<Long, List<ApplyInfo>> applyMap = getApplies(position);
            if (applyMap.isEmpty()) {
                continue;
            }
            // Map<projectId, RecruitInfo>
            Map<Long, RecruitInfo> recruitMap = getRecruits(position);
            if (recruitMap.isEmpty()) {
                continue;
            }
            log.info("position:{} \ttry", position);
            Map<Long, Set<Long>> allocated = teamBuilder.allocate(applyMap, recruitMap);
            log.info("position:{} \tsuccess", position);

            // Map<projectId, Set<userId>> -> Map<projectId, Map<position, Set<userId>>>
            for (Map.Entry<Long, Set<Long>> entry : allocated.entrySet()) {
                long projectId = entry.getKey();
                Set<Long> userIds = entry.getValue();

                // 프로젝트별 Position Map (EnumMap 메모리/성능 유리)
                Map<Position, Set<Long>> byPosition
                        = results.computeIfAbsent(projectId, k -> new EnumMap<>(Position.class));

                // 해당 포지션의 Member Set
                Set<Long> members = byPosition.computeIfAbsent(position, k -> new HashSet<>());
                members.addAll(userIds);
            }
        }

        saveTeamBuildingResults(results);
    }

    // TODO: 내부 객체에 position 빼기
    private Map<Long, List<ApplyInfo>> getApplies(Position pos) {
        List<ProjectApply> applyEntities = applyRepository.findAllBySemesterAndPosition(generateSemester(), pos);
        if (applyEntities.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, List<ApplyInfo>> applyMap = new HashMap<>();
        for (ProjectApply applyEntity : applyEntities) {
            long memberId = applyEntity.getUser().getId();
            long projectId = applyEntity.getProject().getProjectId();
            List<ApplyInfo> applyInfos = applyMap.computeIfAbsent(memberId, key -> new ArrayList<>());
            applyInfos.add(ApplyInfo.builder()
                    .userId(memberId)
                    .projectId(projectId)
                    .priority(applyEntity.getPriority())
                    .position(applyEntity.getPosition())
                    .build()
            );
        }

        return applyMap;
    }

    private Map<Long, RecruitInfo> getRecruits(Position pos) {
        List<ProjectRecruit> recruitEntities = recruitRepository.findAllBySemesterAndPosition(generateSemester(), pos);
        if (recruitEntities.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, RecruitInfo> recruitMap = new HashMap<>();
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
        List<Team> teams = new ArrayList<>();
        for (Map.Entry<Long, Map<Position, Set<Long>>> projectEntry : results.entrySet()) {
            Long projectId = projectEntry.getKey();
            Long leaderId = projectRepository.findById(projectId)
                    .map(project -> project.getUser().getId()) // leader id 찾기
                    .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 프로젝트입니다."));

            Map<Position, Set<Long>> byPosition = projectEntry.getValue();
            for (Map.Entry<Position, Set<Long>> posEntry : byPosition.entrySet()) {
                Position position = posEntry.getKey();
                Set<Long> memberIds = posEntry.getValue();
                for (Long memberId : memberIds) {
                    teams.add(Team.builder()
                            .projectId(projectId)
                            .leaderId(leaderId)
                            .position(position)
                            .memberId(memberId)
                            .semester(generateSemester())
                            .build());
                }
            }
        }

        teamRepository.saveAll(teams);
    }

}
