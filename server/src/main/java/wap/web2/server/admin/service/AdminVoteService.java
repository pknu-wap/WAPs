package wap.web2.server.admin.service;

import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.admin.dto.request.VoteParticipants;
import wap.web2.server.admin.entity.VoteMeta;
import wap.web2.server.admin.repository.VoteMetaRepository;

@Service
@RequiredArgsConstructor
public class AdminVoteService {

    private final VoteMetaRepository voteMetaRepository;

    @Transactional
    public void initializeVote(String semester, Long userId, VoteParticipants voteParticipants) {
        Optional<VoteMeta> voteMeta = voteMetaRepository.findBySemester(semester);
        voteMeta.ifPresentOrElse(
                existingMeta -> existingMeta.reopenTo(voteParticipants.projectIds()),
                // 이번 학기 처음 VoteMeta 생성 시
                () -> {
                    VoteMeta newMeta = VoteMeta.of(semester, userId, voteParticipants.projectIds());
                    voteMetaRepository.save(newMeta);
                }
        );
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
