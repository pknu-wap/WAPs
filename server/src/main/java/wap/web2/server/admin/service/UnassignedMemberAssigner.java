package wap.web2.server.admin.service;

import static wap.web2.server.util.SemesterGenerator.generateSemester;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.teambuild.dto.TeamMemberResult;
import wap.web2.server.teambuild.dto.response.TeamBuildingResults;
import wap.web2.server.teambuild.entity.Field;
import wap.web2.server.teambuild.entity.Position;
import wap.web2.server.teambuild.entity.Team;
import wap.web2.server.teambuild.repository.TeamRepository;
import wap.web2.server.teambuild.service.TeamBuildingResultService;

@Slf4j
@Service
@RequiredArgsConstructor
public class UnassignedMemberAssigner {

    private static final int NEW_TEAM_SIZE = 4;
    private static final int SMALL_BUCKET_THRESHOLD = 3;

    private final TeamBuildingResultService teamBuildingResultService;
    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public void assign(String semester) {
        if (semester == null) {
            semester = generateSemester();
        }

        TeamBuildingResults results = teamBuildingResultService.getResults();
        List<TeamMemberResult> unassigned = teamBuildingResultService.getUnassignedMembers(results);
        if (unassigned.isEmpty()) {
            log.info("[UnassignedAssigner] 미배정자가 없습니다.");
            return;
        }

        Map<Field, List<UnassignedMember>> buckets = bucketByField(unassigned);
        if (buckets.isEmpty()) {
            return;
        }

        List<Team> toSave = new ArrayList<>();
        for (Map.Entry<Field, List<UnassignedMember>> entry : buckets.entrySet()) {
            Field field = entry.getKey();
            List<UnassignedMember> members = entry.getValue();
            processBucket(field, members, semester, toSave);
        }

        if (!toSave.isEmpty()) {
            teamRepository.saveAll(toSave);
        }
        log.info("[UnassignedAssigner] 처리된 미배정자: {}", toSave.size());
    }

    private void processBucket(Field field,
                               List<UnassignedMember> members,
                               String semester,
                               List<Team> sink) {
        Map<Long, Team> existingTeams = existingTeamsByField(field, semester);
        if (members.size() <= SMALL_BUCKET_THRESHOLD) {
            if (existingTeams.isEmpty()) {
                createNewTeams(field, members, semester, sink);
            } else {
                distributeToExistingTeams(members, existingTeams, semester, sink);
            }
            return;
        }
        formNewTeamsAndDistributeRemainder(field, members, existingTeams, semester, sink);
    }

    private Map<Field, List<UnassignedMember>> bucketByField(List<TeamMemberResult> unassigned) {
        Map<Field, List<UnassignedMember>> buckets = new EnumMap<>(Field.class);
        Set<Long> userIds = unassigned.stream().map(TeamMemberResult::getId).collect(Collectors.toSet());
        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        for (TeamMemberResult result : unassigned) {
            Position position = resolvePosition(result, userMap.get(result.getId()));
            Field field = position == null ? Field.WEB : position.toField();
            buckets.computeIfAbsent(field, k -> new ArrayList<>())
                    .add(new UnassignedMember(result.getId(), position));
        }
        return buckets;
    }

    private Position resolvePosition(TeamMemberResult result, User user) {
        if (user != null && user.getPrimaryPosition() != null) {
            return user.getPrimaryPosition();
        }
        return result.getPosition();
    }

    private void distributeToExistingTeams(List<UnassignedMember> members,
                                           Map<Long, Team> candidates,
                                           String semester,
                                           List<Team> sink) {
        Map<Long, Long> memberCountByProject = memberCountByProject(semester);

        for (UnassignedMember member : members) {
            Long projectId = candidates.keySet().stream()
                    .min(Comparator
                            .<Long>comparingLong(pid -> memberCountByProject.getOrDefault(pid, 0L))
                            .thenComparing(Long::compareTo))
                    .orElseThrow();

            Team template = candidates.get(projectId);
            sink.add(Team.builder()
                    .projectId(template.getProjectId())
                    .leaderId(template.getLeaderId())
                    .memberId(member.userId())
                    .position(member.position())
                    .semester(semester)
                    .field(null)
                    .build());
            memberCountByProject.merge(projectId, 1L, Long::sum);
        }
    }

    private void formNewTeamsAndDistributeRemainder(Field field,
                                                    List<UnassignedMember> members,
                                                    Map<Long, Team> existingTeams,
                                                    String semester,
                                                    List<Team> sink) {
        List<List<UnassignedMember>> groups = new ArrayList<>();
        for (int i = 0; i < members.size(); i += NEW_TEAM_SIZE) {
            groups.add(new ArrayList<>(members.subList(i, Math.min(i + NEW_TEAM_SIZE, members.size()))));
        }

        List<UnassignedMember> last = groups.get(groups.size() - 1);
        if (last.size() < NEW_TEAM_SIZE) {
            groups.remove(groups.size() - 1);
            if (existingTeams.isEmpty()) {
                createNewTeams(field, last, semester, sink);
            } else {
                distributeToExistingTeams(last, existingTeams, semester, sink);
            }
        }

        for (List<UnassignedMember> group : groups) {
            createNewTeams(field, group, semester, sink);
        }
    }

    private void createNewTeams(Field field,
                                List<UnassignedMember> members,
                                String semester,
                                List<Team> sink) {
        for (UnassignedMember member : members) {
            sink.add(Team.builder()
                    .projectId(null)
                    .leaderId(null)
                    .memberId(member.userId())
                    .position(member.position())
                    .semester(semester)
                    .field(field)
                    .build());
        }
    }

    private Map<Long, Team> existingTeamsByField(Field field, String semester) {
        List<Team> teams = teamRepository.findAllBySemester(semester);
        Map<Long, Project> projectCache = new HashMap<>();
        Map<Long, Team> result = new LinkedHashMap<>();
        Set<Long> seen = new HashSet<>();
        for (Team team : teams) {
            if (team.getProjectId() == null || !seen.add(team.getProjectId())) {
                continue;
            }
            Project project = projectCache.computeIfAbsent(team.getProjectId(),
                    id -> projectRepository.findById(id).orElse(null));
            if (project == null) {
                continue;
            }
            if (Field.fromProjectType(project.getProjectType()) == field) {
                result.put(team.getProjectId(), team);
            }
        }
        return result;
    }

    private Map<Long, Long> memberCountByProject(String semester) {
        Map<Long, Long> map = new HashMap<>();
        for (TeamRepository.TeamMemberCount count : teamRepository.countMembersByProject(semester)) {
            map.put(count.getProjectId(), count.getMemberCount());
        }
        return map;
    }

    private record UnassignedMember(Long userId, Position position) {
    }
}