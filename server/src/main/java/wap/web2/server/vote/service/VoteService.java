package wap.web2.server.vote.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.vote.dto.VoteRequest;

@Service
@RequiredArgsConstructor
public class VoteService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    //Transactional인 메서드에서 투표 실시, marking user vote 가 들어있어야 transactional 하게 처리할 수 있다.
    @Transactional
    public void processVote(UserPrincipal userPrincipal, VoteRequest voteRequest) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));

        if (!user.canVote()) {
            throw new IllegalStateException("[ERROR] 투표를 이미 완료했습니다.");
        }

        vote(voteRequest);
        markVoted(user);
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
