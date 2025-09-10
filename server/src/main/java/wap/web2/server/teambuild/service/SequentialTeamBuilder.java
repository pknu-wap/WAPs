package wap.web2.server.teambuild.service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import wap.web2.server.teambuild.dto.ApplyInfo;
import wap.web2.server.teambuild.dto.RecruitInfo;

@Slf4j
public class SequentialTeamBuilder implements TeamBuilder {

    @Override
    public Map<Long, Set<Long>> allocate(Map<Long, List<ApplyInfo>> applicantWishes,
                                         Map<Long, RecruitInfo> leaderWishes) {
        // teamId -> {members}
        Map<Long, Set<Long>> teams = initTeam(leaderWishes);

        // 구성된 팀에서 중복된 인원을 제거하며 팀원을 재배치
        while (true) {
            // 여러 팀에 합류하고 있는 인원을 고름
            Set<Long> members = getDuplicateMemberOf(teams);

            // 구성된 모든 팀에 중복되는 인원이 없다면 종료
            if (members.isEmpty()) {
                return teams;
            }

            // 중복되는 인원은 자신이 가장 원하는 팀에 합류
            for (Long memberId : members) {
                traceToMaxPriority(memberId, teams, applicantWishes, leaderWishes);
            }
        }
    }

    /**
     * 맨 처음 팀장이 희망하는 대로 팀을 구성합니다. 팀에 지원자가 gyunho, kangrae, tobi, crong이 있고, 2명을 뽑고 싶을 때 [gyunho, kangrae]로 이루어진 팀을
     * 구성합니다.
     *
     * @param leaderWishes: 팀장이 희망하는 순서대로 정렬된 지원자 정보
     * @return 팀장이 희망하는대로 구성된 팀을 반환
     */
    private Map<Long, Set<Long>> initTeam(Map<Long, RecruitInfo> leaderWishes) {
        Map<Long, Set<Long>> teams = new HashMap<>();

        for (Entry<Long, RecruitInfo> team : leaderWishes.entrySet()) {
            Long teamId = team.getKey(); // projectId
            Integer capacity = team.getValue().getCapacity();
            if (capacity < 0) {
                capacity = 0;
                log.info("[TeamBuilder] 팀장이 원하는 팀의 규모가 0보다 작아서 0으로 변경합니다.");
            }

            Set<Long> temporaryTeam = new LinkedHashSet<>();
            addAcceptableMember(team, capacity, temporaryTeam);

            teams.put(teamId, temporaryTeam);
        }

        return teams;
    }

    private void addAcceptableMember(Entry<Long, RecruitInfo> team, Integer capacity, Set<Long> temporaryTeam) {
        for (int i = 0; i < capacity; i++) {
            Set<Long> userIds = team.getValue().getUserIds();
            if (userIds.isEmpty()) {
                break;
            }
            Long applicant = userIds.stream().findFirst().get();
            userIds.remove(applicant);
            temporaryTeam.add(applicant);
        }
    }

    private Set<Long> getDuplicateMemberOf(Map<Long, Set<Long>> teams) {
        int size = teams.values().stream().mapToInt(Set::size).sum();
        Set<Long> memberIds = new HashSet<>(size); // resize 비용을 줄이기 위해
        Set<Long> duplicateMemberIds = new HashSet<>(size / 3); // 중복되는 인원은 지원자수보다 훨씬 적을것으로 추정되므로

        for (Set<Long> currentMembers : teams.values()) {
            for (Long id : currentMembers) {
                if (id == null) {
                    log.info("[TeamBuilder] 팀의 멤버 리스트에 NULL이 포함되어 있습니다.");
                    continue;
                }
                boolean isNew = memberIds.add(id);
                if (!isNew) {
                    duplicateMemberIds.add(id);
                }
            }
        }

        return duplicateMemberIds;
    }

    /**
     * 여러 팀에 합류해있는 사람은 우선순위가 가장 높은 팀으로 합류됩니다. 팀원을 잃은 팀은 새로운 멤버를 추가합니다. 이 멤버는 leaderWishes에 존재합니다.
     *
     * @param memberId:        여러 팀에 합류해있는 사람
     * @param teams:           현재까지 완성된 팀 명단
     * @param applicantWishes: 모든 동아리원의 지원서를 담는 Map
     * @param leaderWishes:    팀장이 희망하는 팀원 명단
     */
    private void traceToMaxPriority(Long memberId,
                                    Map<Long, Set<Long>> teams,
                                    Map<Long, List<ApplyInfo>> applicantWishes,
                                    Map<Long, RecruitInfo> leaderWishes) {
        List<ApplyInfo> applyInfos = applicantWishes.get(memberId); // 한 명의 중복되는 멤버가 가지는 모든 지원서

        boolean isJoin = false;

        if (applyInfos == null) {
            log.info("[TeamBuilder] 중복되는 멤버 {}의 지원서가 NULL 입니다.", memberId);
        }

        for (ApplyInfo apply : applyInfos) {
            Long teamId = apply.getProjectId();     // 어떤 프로젝트에 지원했는지
            Set<Long> members = teams.get(teamId);  // 그 프로젝트의 현재 멤버

            if (members == null) {
                log.info("[TeamBuilder] {}팀에 멤버 리스트가 초기화되지 않았습니다: member's apply={}, memberId={}, teams={}",
                        teamId, apply.toString(), memberId, teams.toString());
            }
            if (!members.contains(memberId)) {      // 멤버가 초기에 new 설정되었고 remove 하기에 null 검사 필요없음
                continue;
            }

            // 가장 높은 우선순위를 가진 팀에게 할당 == 그대로 놔두기 (List<ApplyInfo>에는 우선순위 순서대로 저장되어있음)
            if (!isJoin) {
                isJoin = true;
            } else {
                members.remove(memberId);                       // 중복되는 인원를 팀에서 제거
                addNewMember(teamId, members, leaderWishes);    // 새로운 지원자를 팀으로 합류
            }
        }
    }

    /**
     * 현재 남아있는 지원자 명단 중 팀장이 가장 원하는 인원을 추가합니다.
     */
    private void addNewMember(Long teamId, Set<Long> members, Map<Long, RecruitInfo> leaderWishes) {
        Set<Long> applicants = leaderWishes.get(teamId).getUserIds();
        if (applicants.isEmpty()) {
            return;
        }

        // 리스트의 맨 앞에는 팀장이 가장 원하는 팀원이 있음
        Long newMember = applicants.stream().findFirst().get();
        applicants.remove(newMember);
        members.add(newMember);
    }

}
