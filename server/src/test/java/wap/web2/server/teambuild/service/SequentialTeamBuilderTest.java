package wap.web2.server.teambuild.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import wap.web2.server.teambuild.dto.ApplyInfo;
import wap.web2.server.teambuild.dto.RecruitInfo;
import wap.web2.server.teambuild.entity.Position;

class SequentialTeamBuilderTest {

    private final TeamBuilder teamBuilder = new SequentialTeamBuilder();

    @Test
    void buildTeam() throws Exception {
        //given
        Map<Long, List<ApplyInfo>> applicantWishes = makeApplications();
        Map<Long, RecruitInfo> leaderWishes = makeRecruits();

        //when
        Map<Long, Set<Long>> teams = teamBuilder.allocate(applicantWishes, leaderWishes);

        //then
        assertThat(teams.get(1L)).containsExactlyInAnyOrder(1L, 3L, 5L);
        assertThat(teams.get(2L)).containsExactlyInAnyOrder(2L);
        assertThat(teams.get(3L)).containsExactlyInAnyOrder(4L);
        assertThat(teams.get(4L)).containsExactlyInAnyOrder(6L);
    }

    @Test
    @DisplayName("원하는 인원수보다 팀의 지원자가 더 적을 때 IndexOutOfBound 던지는지 확인")
    void applicantNumLessThanCapacity() throws Exception {
        //given
        Map<Long, List<ApplyInfo>> applicantWishes = makeApplications();
        Map<Long, RecruitInfo> leaderWishes = Map.of(1L,
                new RecruitInfo(1001L, 1L, Position.BACKEND, 3, List.of(1L)));

        //then
        assertDoesNotThrow(() -> teamBuilder.allocate(applicantWishes, leaderWishes));
    }

    @Test
    @DisplayName("지원자가 원하는 팀이 실제로 존재하지 않을 때 예외를 던지는지 확인")
    void nonExistentTeam() throws Exception {
        //given
        Long ghostTeam = 999L;
        Long ghostProject = 999L;
        Map<Long, List<ApplyInfo>> applicantWishes = makeApplications();
        Map<Long, RecruitInfo> leaderWishes = Map.of(ghostTeam,
                new RecruitInfo(1001L, ghostProject, Position.BACKEND, 3, List.of(1L, 2L, 3L, 4L)));

        //then
        assertDoesNotThrow(() -> teamBuilder.allocate(applicantWishes, leaderWishes));
    }

    @Test
    @DisplayName("중복 제거 후 새로 추가할 멤버가 없다면 비어있는 팀이 됨")
    void noNewMemberAfterDuplicateRemoval() throws Exception {
        //given
        Long wishProject = 1L;
        Long applicant = 101L;
        Map<Long, List<ApplyInfo>> applicantWishes = Map.of(
                applicant, List.of(
                        new ApplyInfo(1, Position.BACKEND, 1L, wishProject),
                        new ApplyInfo(2, Position.BACKEND, 1L, 2L)
                )
        );
        Map<Long, RecruitInfo> duplicateLeaderWishes = Map.of(
                1L, new RecruitInfo(1001L, 1L, Position.BACKEND, 1, List.of(applicant)),
                2L, new RecruitInfo(1002L, 2L, Position.BACKEND, 1, List.of(applicant))
        );

        //when
        Map<Long, Set<Long>> results = teamBuilder.allocate(applicantWishes, duplicateLeaderWishes);

        //then
        assertTrue(results.values().stream().anyMatch(Set::isEmpty)); // 둘 중 한 팀은 비어 있음
        // 우선순위가 높은 팀에게 할당됨
        assertTrue(results.get(wishProject).contains(applicant));
    }

    @Test
    @DisplayName("팀장이 원하는 인원과 팀원이 원하는 팀이 서로 교차될 때")
    void wishesDeadLock() throws Exception {
        //given
        // jo는 1팀, 2팀 순으로 선호
        // gyun은 2팀, 1팀 순으로 선호
        // 1팀은 gyun, jo 순으로 선호
        // 2팀은 jo, gyun 순으로 선호
        Long jo = 101L, gyun = 102L;
        Long team1 = 1L, team2 = 2L;
        Map<Long, List<ApplyInfo>> applicantWishes = Map.of(
                jo, List.of(
                        new ApplyInfo(1, Position.BACKEND, jo, team1),
                        new ApplyInfo(2, Position.BACKEND, jo, team2)),
                gyun, List.of(
                        new ApplyInfo(1, Position.BACKEND, gyun, team2),
                        new ApplyInfo(2, Position.BACKEND, gyun, team1))
        );
        Map<Long, RecruitInfo> leaderWishes = Map.of(
                team1, new RecruitInfo(1001L, team1, Position.BACKEND, 1, List.of(gyun, jo)),
                team2, new RecruitInfo(1002L, team2, Position.BACKEND, 1, List.of(jo, gyun))
        );
        //when
        Map<Long, Set<Long>> results = teamBuilder.allocate(applicantWishes, leaderWishes);

        //then
        assertThat(results.get(team1)).containsOnly(gyun);
        assertThat(results.get(team2)).containsOnly(jo);
    }

    @Test
    @DisplayName("팀 크기를 0으로 두면 어떤 인원도 할당되지 않는다.")
    void denyIfZeroCapacity() throws Exception {
        //given
        Long jo = 101L, gyun = 102L;
        Long team1 = 1L, team2 = 2L;
        Map<Long, List<ApplyInfo>> applicantWishes = Map.of(
                jo, List.of(
                        new ApplyInfo(1, Position.BACKEND, jo, team1),
                        new ApplyInfo(2, Position.BACKEND, jo, team2)),
                gyun, List.of(
                        new ApplyInfo(1, Position.BACKEND, gyun, team2),
                        new ApplyInfo(2, Position.BACKEND, gyun, team1))
        );
        Map<Long, RecruitInfo> leaderWishes = Map.of(
                team1, new RecruitInfo(1001L, team1, Position.BACKEND, 0, Collections.emptyList()),
                team2, new RecruitInfo(1002L, team2, Position.BACKEND, 2, List.of(gyun, jo))
        );

        //when
        Map<Long, Set<Long>> results = teamBuilder.allocate(applicantWishes, leaderWishes);

        //then
        assertTrue(results.get(team1).isEmpty());
        assertThat(results.get(team2).size()).isEqualTo(2);
    }

    @Test
    @DisplayName("파라미터로 null을 넣었을 때 예외를 발생시킨다")
    public void testNullValues() {
        // null 파라미터
        Map<Long, RecruitInfo> leaderWishes = makeRecruits();

        assertThrows(NullPointerException.class, () -> {
            teamBuilder.allocate(null, leaderWishes);
        });

        assertThrows(NullPointerException.class, () -> {
            teamBuilder.allocate(Map.of(), null);
        });
    }

    @Test
    @DisplayName("팀장의 위시리스트가 비어있다면 지원 명단은 누락되어도 예외를 던지지 않는다")
    void notThrowIfEmptyLeaderWishes() throws Exception {
        assertDoesNotThrow(() -> {
            teamBuilder.allocate(null, Map.of());
        });
    }

    private Map<Long, String> userMap() {
        Map<Long, String> users = new HashMap<>();
        users.put(1L, "김균호");
        users.put(2L, "조강래");
        users.put(3L, "고근호");
        users.put(4L, "박준용");
        users.put(5L, "구교황");
        users.put(6L, "팔교황");
        return users;
    }

    private Map<Long, String> teamMap() {
        Map<Long, String> users = new HashMap<>();
        users.put(1L, "스타리스트");
        users.put(2L, "커켓몬");
        users.put(3L, "같이타요");
        users.put(4L, "딸깍");
        return users;
    }

    private Map<Long, List<ApplyInfo>> makeApplications() {
        Map<Long, List<ApplyInfo>> applyMap = new HashMap<>();
        Position position = Position.BACKEND;

        applyMap.put(1L, List.of(
                new ApplyInfo(1, position, 1L, 1L),
                new ApplyInfo(2, position, 1L, 4L),
                new ApplyInfo(3, position, 1L, 2L)));
        applyMap.put(2L, List.of(
                new ApplyInfo(1, position, 2L, 2L),
                new ApplyInfo(2, position, 2L, 3L),
                new ApplyInfo(3, position, 2L, 1L)));
        applyMap.put(3L, List.of(
                new ApplyInfo(1, position, 3L, 1L),
                new ApplyInfo(2, position, 3L, 4L),
                new ApplyInfo(3, position, 3L, 3L)));
        applyMap.put(4L, List.of(
                new ApplyInfo(1, position, 4L, 3L),
                new ApplyInfo(2, position, 4L, 1L),
                new ApplyInfo(3, position, 4L, 2L)));
        applyMap.put(5L, List.of(
                new ApplyInfo(1, position, 5L, 1L),
                new ApplyInfo(2, position, 5L, 4L),
                new ApplyInfo(3, position, 5L, 3L)));
        applyMap.put(6L, List.of(
                new ApplyInfo(1, position, 6L, 4L),
                new ApplyInfo(2, position, 6L, 2L),
                new ApplyInfo(3, position, 6L, 1L)));

        return applyMap;
    }

    private Map<Long, RecruitInfo> makeRecruits() {
        Map<Long, RecruitInfo> leaderPriorityMap = new HashMap<>();
        Position position = Position.BACKEND;

        leaderPriorityMap.put(1L, new RecruitInfo(1001L, 1L, position, 3, List.of(1L, 2L, 3L, 4L, 5L, 6L)));
        leaderPriorityMap.put(2L, new RecruitInfo(1002L, 2L, position, 3, List.of(4L, 2L, 1L)));
        leaderPriorityMap.put(3L, new RecruitInfo(1003L, 3L, position, 2, List.of(2L, 3L, 5L, 4L)));
        leaderPriorityMap.put(4L, new RecruitInfo(1004L, 4L, position, 2, List.of(1L, 6L, 3L, 5L)));

        return leaderPriorityMap;
    }
}
