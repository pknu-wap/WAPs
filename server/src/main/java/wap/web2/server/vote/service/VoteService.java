package wap.web2.server.vote.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.vote.dto.VoteInfoResponse;
import wap.web2.server.vote.dto.VoteRequest;
import wap.web2.server.vote.dto.VoteResultResponse;
import wap.web2.server.vote.entity.Vote;
import wap.web2.server.vote.repository.VoteRepository;

@Service
@RequiredArgsConstructor
public class VoteService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;

    // Transactional인 메서드에서 투표 실시, marking user vote 가 들어있어야 transactional 하게 처리할 수 있다.
    @Transactional
    public void processVote(UserPrincipal userPrincipal, VoteRequest voteRequest) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));

        if (!user.canVote()) {
            throw new IllegalStateException("[ERROR] 투표를 이미 완료했습니다.");
        }

        vote(voteRequest);
        markVoted(user);
        user.updateVotedProjectIds(voteRequest);
    }

    @Transactional
    public VoteInfoResponse getVoteInfo(UserPrincipal userPrincipal, Integer year, Integer semester) {
        Vote vote = voteRepository.findVoteByYearAndSemester(year, semester)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지않는 투표입니다."));
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));

        return new VoteInfoResponse(vote.getIsOpen(), user.getVoted());
    }

    @Transactional
    public List<VoteResultResponse> getVoteResults(Integer year, Integer semester) {
        Vote vote = voteRepository.findVoteByYearAndSemester(year, semester)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지않는 투표입니다."));

        List<VoteResultResponse> results = vote.getProjectList().stream()
                .map(VoteResultResponse::from)
                .toList();

        // 전체 수
        long sum = results.stream().mapToLong(VoteResultResponse::getVoteCount).sum();
        results.forEach(result -> result.calcVoteRate(sum));

        return results;
    }

    private void vote(VoteRequest voteRequest) {
        for (Long projectId : voteRequest.getProjectIds()) {
            int updated = projectRepository.voteByProjectId(projectId);
            if (updated == 0) {
                throw new IllegalArgumentException("[ERROR] 존재하지 않는 프로젝트입니다. projectId : " + projectId);
            }
        }
    }

    private void markVoted(User user) {
        userRepository.updateVotedTrueByUserId(user.getId());
    }

}
