package wap.web2.server.vote.service;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static wap.web2.server.config.TestInit.USER_COUNT;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.vote.dto.VoteRequest;

@SpringBootTest
@Transactional
class VoteServiceTest {

    private final List<Long> projectIds = List.of(1L, 2L, 3L);

    @Autowired
    private VoteService voteService;
    @Autowired
    private ProjectRepository projectRepository;

    //@Test
    void 순차_투표_성공() {
        // given: 1, 2, 3번 프로젝트 투표 요청 객체
        VoteRequest request = new VoteRequest(projectIds);

        // when: 30명이 투표 요청
        for (long userId = 0; userId < USER_COUNT; userId++) {
            voteService.processVote(userId + USER_COUNT, request);
        }

        for (long projectId : projectIds) {
            assertThat(countVotesByProjectId(projectId)).isEqualTo(USER_COUNT);
        }
    }

    /*
        sub thread는 transactional 롤백의 영향을 받지 않음으로 수동 롤백.... 더 멋진 방법으로 찾아올게요...
        UPDATE user SET voted = 0;
        DELETE FROM user_voted_project_ids;
        UPDATE project SET vote_count = 0;
    */
    @Test
    void 동시_투표_성공() throws InterruptedException {
//        VoteRequest request = new VoteRequest(projectIds); // 준비된 프로젝트
//        int threads = USER_COUNT;
//
//        ExecutorService executorService = Executors.newFixedThreadPool(threads);
//        CountDownLatch latch = new CountDownLatch(threads);
//
//        for (long uid = 0; uid < threads; uid++) {
//            final long userId = uid + USER_COUNT;    // 복사해서 final로 사용
//            executorService.submit(() -> {
//                try {
//                    voteService.processVote(userId, request);
//                } catch (Exception e) {
//                    System.out.println(e.getMessage());
//                } finally {
//                    latch.countDown();
//                }
//            });
//        }
//        latch.await();
//
//        for (long projectId : projectIds) {
//            assertThat(countVotesByProjectId(projectId)).isEqualTo(threads);
//        }
    }

    private long countVotesByProjectId(Long projectId) {
        return projectRepository.findById(projectId)
                .map(Project::getVoteCount)
                .orElse(0L);
    }

}