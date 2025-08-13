package wap.web2.server.vote.service;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static wap.web2.server.config.TestInit.USER_COUNT;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.vote.dto.VoteRequest;

@SpringBootTest
@Transactional  // 투표 테스트 후 롤백
class VoteServiceTest {

    private final List<Long> projectIds = List.of(1L, 2L, 3L);

    // 각 호출을 별도 트랜잭션으로 실행
    @Autowired
    private TransactionTemplate tx;
    @Autowired
    private VoteService voteService;
    @Autowired
    private ProjectRepository projectRepository;


    @Test
    void 순차_투표_30명_성공() {
        // given: 1, 2, 3번 프로젝트 투표 요청 객체
        VoteRequest request = new VoteRequest(projectIds);

        // when: 30명이 투표 요청
        for (long userId = 1; userId <= USER_COUNT; userId++) {
            voteService.processVote(userId, request);
        }

        for (long projectId : projectIds) {
            long cnt = countVotesByProjectId(projectId);
            assertThat(cnt).isEqualTo(USER_COUNT);
        }
    }

    private long countVotesByProjectId(Long projectId) {
        return projectRepository.findById(projectId)
                .map(Project::getVoteCount)
                .orElse(0L);
    }

}