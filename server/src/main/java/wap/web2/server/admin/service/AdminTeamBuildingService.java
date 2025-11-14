package wap.web2.server.admin.service;

import static wap.web2.server.util.SemesterGenerator.generateSemester;
import static wap.web2.server.util.SemesterGenerator.generateSemesterValue;
import static wap.web2.server.util.SemesterGenerator.generateYearValue;

import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.admin.dto.TeamBuildingStatusRequest;
import wap.web2.server.admin.entity.TeamBuildingMeta;
import wap.web2.server.admin.entity.TeamBuildingStatus;
import wap.web2.server.admin.repository.TeamBuildingMetaRepository;
import wap.web2.server.project.entity.Project;
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
import wap.web2.server.teambuild.service.TeamBuilder;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminTeamBuildingService {

    private final TeamBuildingMetaRepository teamBuildingMetaRepository;
    private final ProjectRecruitRepository recruitRepository;
    private final ProjectApplyRepository applyRepository;
    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;
    private final TeamBuilder teamBuilder;

    @Transactional
    public void changeStatus(TeamBuildingStatusRequest statusRequest) {
        String semester = statusRequest.semester();
        TeamBuildingStatus status = statusRequest.status();
        int updated = teamBuildingMetaRepository.updateTeamBuildingMetaStatus(semester, status);
        if (updated == 0) {
            throw new IllegalArgumentException(String.format("[ERROR] %s 학기의 팀빌딩이 존재하지 않습니다.", semester));
        }
    }

    @Transactional
    public void openTeamBuilding(String semester) {
        if (teamBuildingMetaRepository.existsTeamBuildingMetaBySemester(semester)) {
            throw new IllegalArgumentException("[ERROR] 해당 학기의 팀빌딩이 이미 생성되었습니다.");
        }

        TeamBuildingMeta teamBuildingMeta = new TeamBuildingMeta(semester);
        teamBuildingMetaRepository.save(teamBuildingMeta);
    }

    @Transactional
    public void makeTeam() {
        TeamBuildingMeta current = findCurrentMeta();
        validateTeamBuildingStatus(current);

        // 이번학기 모든 프로젝트
        List<Project> projects
                = projectRepository.findProjectsByYearAndSemester(generateYearValue(), generateSemesterValue());

        // Map<projectId, Map<position, Set<userId>>>
        Map<Long, Map<Position, Set<Long>>> results = new HashMap<>();
        for (Position position : Position.values()) {
            // Map<userId, List<ApplyInfo>>
            Map<Long, List<ApplyInfo>> applyMap = getApplies(position);
            if (applyMap.isEmpty()) {
                continue;
            }
            // Map<projectId, RecruitInfo>
            Map<Long, RecruitInfo> recruitMap = getRecruits(position, projects);
            if (recruitMap.isEmpty()) {
                continue;
            }

            log.info("team-build-position:{} \ttry", position);
            Map<Long, Set<Long>> allocated = teamBuilder.allocate(applyMap, recruitMap);
            log.info("team-build-position:{} \tsuccess", position);

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

    private Map<Long, RecruitInfo> getRecruits(Position pos, List<Project> projects) {
        List<ProjectRecruit> recruitEntities = recruitRepository.findAllBySemesterAndPosition(generateSemester(), pos);
        if (recruitEntities.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, RecruitInfo> recruitMap = new HashMap<>();
        for (ProjectRecruit recruitEntity : recruitEntities) {
            long projectId = recruitEntity.getProjectId();
            Set<Long> userIds = new LinkedHashSet<>();
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

        // 현재 pos에 관심이 없는 프로젝트는 cap(0), userIds(empty)로 세팅한다.
        for (Project project : projects) {
            long projectId = project.getProjectId();
            if (!recruitMap.containsKey(projectId)) {
                recruitMap.put(projectId, RecruitInfo.builder()
                        .leaderId(project.getUser().getId())
                        .projectId(projectId)
                        .position(pos)
                        .capacity(0)
                        .userIds(new LinkedHashSet<>()) // 불변이 보장된다면 Collections.emptySet() 가능
                        .build());
            }
        }

        return recruitMap;
    }

    private TeamBuildingMeta findCurrentMeta() {
        String semester = generateSemester();
        return teamBuildingMetaRepository.findBySemester(semester)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 현재 학기의 팀빌딩이 초기화되지 않았습니다."));
    }

    private void validateTeamBuildingStatus(TeamBuildingMeta current) {
        if (current.getStatus() == TeamBuildingStatus.CLOSED) {
            throw new IllegalArgumentException("[ERROR] 팀빌딩 기능이 닫혀 있습니다");
        }
    }

    //TODO: transactional 로 바꾸기
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
