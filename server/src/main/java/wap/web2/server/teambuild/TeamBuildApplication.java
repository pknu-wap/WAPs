package wap.web2.server.teambuild;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class TeamBuildApplication {
    public static void main(String[] args) {

        Map<String, List<Apply>> applyMap = new HashMap<>();
        applyMap.put("김균호", Apply.of("backend", List.of("스타리스트", "딸깍", "커켓몬")));
        applyMap.put("조강래", Apply.of("backend", List.of("커켓몬", "같이타요", "스타리스트")));
        applyMap.put("고근호", Apply.of("backend", List.of("스타리스트", "딸깍", "같이타요")));
        applyMap.put("박준용", Apply.of("backend", List.of("같이타요", "스타리스트", "커켓몬")));
        applyMap.put("구교황", Apply.of("backend", List.of("스타리스트", "딸깍", "같이타요")));
        applyMap.put("팔교황", Apply.of("backend", List.of("딸깍", "커켓몬", "스타리스트")));

        Map<String, LeaderPriority> leaderPriorityMap = new HashMap<>();
        leaderPriorityMap.put("스타리스트", new LeaderPriority(3, List.of("김균호", "조강래", "고근호", "박준용", "구교황", "팔교황")));
        leaderPriorityMap.put("커켓몬", new LeaderPriority(3, List.of("박준용", "조강래", "김균호")));
        leaderPriorityMap.put("같이타요", new LeaderPriority(2, List.of("조강래", "고근호", "구교황", "박준용")));
        leaderPriorityMap.put("딸깍", new LeaderPriority(2, List.of("김균호", "팔교황", "고근호", "구교황")));

        TeamBuilder teamBuilder = new TeamBuilder();
        Map<String, List<String>> finalTeam = teamBuilder.allocate(applyMap, leaderPriorityMap);
        System.out.println(finalTeam);
        // result: {딸깍=[팔교황], 스타리스트=[김균호, 고근호, 구교황], 같이타요=[박준용], 커켓몬=[조강래]}

        Map<String, List<Apply>> frontApplies = new HashMap<>();
        frontApplies.put("김균호", Apply.of("frontend", List.of("스타리스트", "딸깍", "커켓몬")));
        frontApplies.put("조강래", Apply.of("frontend", List.of("커켓몬", "같이타요", "스타리스트")));
        frontApplies.put("고근호", Apply.of("frontend", List.of("스타리스트", "딸깍", "같이타요")));
        frontApplies.put("박준용", Apply.of("frontend", List.of("같이타요", "스타리스트", "커켓몬")));
        frontApplies.put("구교황", Apply.of("frontend", List.of("스타리스트", "딸깍", "같이타요")));
        frontApplies.put("팔교황", Apply.of("frontend", List.of("딸깍", "커켓몬", "스타리스트")));

        Map<String, LeaderPriority> frontPriorityMap = new HashMap<>();
        frontPriorityMap.put("스타리스트", new LeaderPriority(1, List.of("김균호", "조강래", "고근호", "박준용", "구교황", "팔교황")));
        frontPriorityMap.put("커켓몬", new LeaderPriority(2, List.of("박준용", "조강래", "김균호")));
        frontPriorityMap.put("같이타요", new LeaderPriority(2, List.of("조강래", "고근호", "구교황", "박준용")));
        frontPriorityMap.put("딸깍", new LeaderPriority(4, List.of("김균호", "팔교황", "고근호", "구교황")));

        Map<String, List<String>> finalFrontTeam = teamBuilder.allocate(frontApplies, frontPriorityMap);
        System.out.println(finalFrontTeam);
        // result: {딸깍=[팔교황, 고근호, 구교황], 스타리스트=[김균호], 같이타요=[박준용], 커켓몬=[조강래]}
    }
}
