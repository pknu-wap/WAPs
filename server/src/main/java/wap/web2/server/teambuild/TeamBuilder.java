package wap.web2.server.teambuild;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;

public class TeamBuilder {

    public Map<String, List<String>> allocate(Map<String, List<Apply>> applyMap,
                                              Map<String, LeaderPriority> leaderPriorityMap) {
        Map<String, List<String>> teams = new HashMap<>();

        // 팀장이 원하는대로 팀을 구성
        for (Map.Entry<String, LeaderPriority> entry : leaderPriorityMap.entrySet()) {
            String teamName = entry.getKey();
            teams.put(teamName, new LinkedList<>());
            Integer num = entry.getValue().getMaxMemberNumber();
            List<String> initialTeam = new LinkedList<>();

            for (int i = 0; i < num; ++i) {
                // 지원자를 queue에서 제거해 임시 구성팀에게 할당한다.
                String first = entry.getValue().getMemberNames().poll();
                initialTeam.add(first);
            }

            teams.get(teamName).addAll(initialTeam);
        }

        // 일단 구성된 팀에서 중복된 인원을 제거하며 팀원을 할당합니다.
        while (true) {
            // 먼저 여러 팀에 합류하고 있는 인원을 골라냅니다.
            Set<String> names = this.getDuplicateMemberOf(teams);

            // 중복되는 인원이 없다면 모든 팀이 완성된 것입니다.
            if (names.isEmpty()) {
                return teams;
            }

            for (String name : names) {
                // 중복되는 인원은 자신이 가장 원하는 팀에 우선적으로 합류됩니다.
                this.traceToMaxPriority(name, teams, applyMap, leaderPriorityMap);
            }
        }
    }

    private Set<String> getDuplicateMemberOf(Map<String, List<String>> team) {
        int size = team.values().stream().mapToInt(List::size).sum();
        Set<String> names = new HashSet<>(size); // resize 비용을 줄이기 위해
        Set<String> duplicateNames = new HashSet<>(size / 3); // 중복은 잘 안일어날거 같아서 (지원자 수 / 3)으로 사이즈 제한

        for (List<String> teamMembers : team.values()) {
            for (String member : teamMembers) {
                boolean isNew = names.add(member);
                if (!isNew) {
                    duplicateNames.add(member);
                }
            }
        }

        return duplicateNames;
    }

    /**
     * 여러 팀에 합류해있는 사람은 우선순위가 가장 높은 팀으로 합류된다. 팀원을 잃은 팀은 새로운 멤버를 추가한다. 이 멤버는 leaderPriorityMap에 존재한다.
     * @param name: 여러 팀에 합류해있는 사람
     * @param teams: 현재까지 완성된 팀 명단
     * @param applyMap: 모든 동아리원의 지원서를 담는 Map
     * @param leaderPriorityMap: 팀장이 희망하는 팀원 명단
     */
    private void traceToMaxPriority(String name, Map<String, List<String>> teams, Map<String, List<Apply>> applyMap,
                                    Map<String, LeaderPriority> leaderPriorityMap) {
        List<Apply> applies = applyMap.get(name); // 전달받은
        boolean isJoin = false;

        for (Apply apply : applies) {
            String teamName = apply.getProjectName();
            List<String> members = teams.get(teamName);

            if (members.contains(name)) {
                // 가장 높은 우선순위를 가진 팀에게 할당
                if (!isJoin) {
                    // 할당 - (아무런 조치도 취하지 않음)
                    isJoin = true;
                } else {
                    // 지원자를 팀에서 빼야 함.
                    members.remove(name);
                    // 새로운 지원자를 팀으로 합류시킴
                    this.addNewMember(teamName, members, leaderPriorityMap);
                }
            }
        }

    }

    // 현재 남아있는 팀원 명단 중 팀장이 가장 원하는 인원을 추가합니다.
    private void addNewMember(String teamName, List<String> members, Map<String, LeaderPriority> leaderPriorityMap) {
        Queue<String> memberNames = leaderPriorityMap.get(teamName).getMemberNames();
        if (!memberNames.isEmpty()) {
            // 큐의 front에는 팀장이 가장 원하는 팀원이 있음
            String newMember = memberNames.poll();
            members.add(newMember);
        }
    }
}