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

        for (Map.Entry<String, LeaderPriority> entry : leaderPriorityMap.entrySet()) {
            String teamName = entry.getKey();
            teams.put(teamName, new LinkedList<>());
            Integer num = entry.getValue().getMaxMemberNumber();
            List<String> initialTeam = new LinkedList<>();

            for (int i = 0; i < num; ++i) {
                String first = entry.getValue().getMemberNames().poll();
                initialTeam.add(first);
            }

            teams.get(teamName).addAll(initialTeam);
        }

        while (true) {
            Set<String> names = this.getDuplicateMemberOf(teams);
            if (names.isEmpty()) {
                return teams;
            }

            for (String name : names) {
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

    private void traceToMaxPriority(String name, Map<String, List<String>> teams, Map<String, List<Apply>> applyMap,
                                    Map<String, LeaderPriority> leaderPriorityMap) {
        List<Apply> applies = applyMap.get(name);
        boolean isJoin = false;

        for (Apply apply : applies) {
            String teamName = apply.getProjectName();
            List<String> members = teams.get(teamName);
            if (members.contains(name)) {
                if (!isJoin) {
                    isJoin = true;
                } else {
                    members.remove(name);
                    this.addNewMember(teamName, members, leaderPriorityMap);
                }
            }
        }

    }

    private void addNewMember(String teamName, List<String> members, Map<String, LeaderPriority> leaderPriorityMap) {
        Queue<String> memberNames = leaderPriorityMap.get(teamName).getMemberNames();
        if (!memberNames.isEmpty()) {
            String newMember = memberNames.poll();
            members.add(newMember);
        }
    }
}