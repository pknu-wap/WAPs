package wap.web2.server.admin.service;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.admin.dto.request.VoteParticipants;
import wap.web2.server.admin.entity.VoteMeta;
import wap.web2.server.admin.repository.VoteMetaRepository;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.project.repository.ProjectRepository;

@Service
@RequiredArgsConstructor
public class AdminVoteService {

    private final VoteMetaRepository voteMetaRepository;
    private final ProjectRepository projectRepository;

    @Transactional
    public void initializeVote(String semester, Long userId, VoteParticipants voteParticipants) {
        validateProjectIds(voteParticipants.projectIds());

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

    private void validateProjectIds(Set<Long> projectIds) {
        Set<Long> existingProjectIds = new HashSet<>(projectRepository.findExistingProjectIds(projectIds));
        Set<Long> missing = new HashSet<>(projectIds);
        missing.removeAll(existingProjectIds);

        if (!missing.isEmpty()) {
            throw new ResourceNotFoundException("[ERROR] 존재하지 않는 프로젝트가 포함되어 있습니다. missingIds=" + missing);
        }
    }

}
