package wap.web2.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.domain.User;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.payload.request.VoteRequest;
import wap.web2.server.repository.ProjectRepository;
import wap.web2.server.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class VoteService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    //Transactional인 메서드에서 투표 실시, marking user vote 가 들어있어야 transactional 하게 처리할 수 있다.
    @Transactional
    public void processVote(UserPrincipal userPrincipal, VoteRequest voteRequest) {
        User user = userRepository.findById(userPrincipal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

        if (!user.canVote()) {
            throw new IllegalStateException("투표를 이미 완료했습니다.");
        }

        vote(voteRequest);
        markVoted(user);
    }

    private void vote(VoteRequest voteRequest) {
        for (Long projectId : voteRequest.getProjectIds()) {
            int updated = projectRepository.voteByProjectId(projectId);
            if (updated == 0) {
                throw new IllegalArgumentException("존재하지 않는 프로젝트입니다. projectId : " + projectId);
            }
        }
    }

    private void markVoted(User user) {
        userRepository.updateVotedTrueByUserId(user.getId());
    }
}
