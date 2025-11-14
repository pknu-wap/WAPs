package wap.web2.server.admin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.admin.entity.VoteMeta;
import wap.web2.server.admin.repository.VoteMetaRepository;

@Service
@RequiredArgsConstructor
public class AdminVoteService {

    private final VoteMetaRepository voteMetaRepository;

    @Transactional
    public void initializeVote(String semester, Long userId) {
        if (voteMetaRepository.existsBySemester(semester)) {
            voteMetaRepository.updateToOpen(semester);
            return;
        }

        VoteMeta voteMeta = VoteMeta.of(semester, userId);
        voteMetaRepository.save(voteMeta);
    }

    @Transactional
    public void closeVote(String semester, Long userId) {
        if (voteMetaRepository.existsBySemester(semester)) {
            voteMetaRepository.updateToClosed(semester, userId);
            return;
        }

        throw new IllegalArgumentException(String.format("[ERROR] %s학기의 투표가 존재하지 않습니다.", semester));
    }
}
