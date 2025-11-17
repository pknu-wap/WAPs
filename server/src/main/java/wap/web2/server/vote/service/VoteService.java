package wap.web2.server.vote.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.admin.entity.VoteStatus;
import wap.web2.server.admin.repository.VoteMetaRepository;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.security.core.UserPrincipal;
import wap.web2.server.util.SemesterGenerator;
import wap.web2.server.vote.dto.VoteInfoResponse;
import wap.web2.server.vote.dto.VoteRequest2;
import wap.web2.server.vote.dto.VoteResultResponse;
import wap.web2.server.vote.entity.Ballot;
import wap.web2.server.vote.entity.Vote;
import wap.web2.server.vote.entity.VoteResult;
import wap.web2.server.vote.repository.BallotRepository;
import wap.web2.server.vote.repository.VoteRepository;
import wap.web2.server.vote.repository.VoteResultRepository;

@Service
@RequiredArgsConstructor
public class VoteService {

    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final BallotRepository ballotRepository;
    private final VoteMetaRepository voteMetaRepository;
    private final VoteResultRepository voteResultRepository;

    @Transactional
    public void vote(Long userId, String role, VoteRequest2 voteRequest) {
        String semester = voteRequest.semester();
        Role userRole = Role.from(role);

        VoteStatus voteStatus = voteMetaRepository.findStatusBySemester(semester)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 투표가 존재하지 않습니다."));
        if (voteStatus != VoteStatus.OPEN) {
            throw new IllegalArgumentException(String.format("[ERROR] %s학기의 투표가 열리지 않았습니다.", semester));
        }

        validateUserBallot(semester, userId);
        for (Long projectId : voteRequest.projectIds()) {
            ballotRepository.save(Ballot.of(semester, userId, userRole, projectId));
        }
    }

    @Transactional(readOnly = true)
    public VoteInfoResponse getVoteInfo(UserPrincipal userPrincipal, String semester) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));
        VoteStatus voteStatus = voteMetaRepository.findStatusBySemester(semester)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 투표가 존재하지 않습니다."));

        long votedCount = ballotRepository.countBallotsBySemesterAndUserId(semester, user.getId());
        boolean isVotedUser = votedCount > 0;
        boolean isOpen = (voteStatus == VoteStatus.OPEN);

        return VoteInfoResponse.builder()
                .isVotedUser(isVotedUser)
                .isOpen(isOpen)
                .build();
    }

    @Transactional(readOnly = true)
    public List<VoteResultResponse> getVoteResults(Integer year, Integer semester) {
        if (year == null || semester == null) {
            year = SemesterGenerator.generateYearValue();
            semester = SemesterGenerator.generateSemesterValue();
        }

        Vote vote = voteRepository.findVoteByYearAndSemester(year, semester)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 투표입니다."));

        List<VoteResult> voteResults = voteResultRepository.findByVoteId(vote.getId());
        if (voteResults.isEmpty()) {
            throw new IllegalArgumentException("[ERROR] 투표 결과가 존재하지 않습니다.");
        }

        List<VoteResultResponse> results = vote.getProjectList().stream()
                .map(VoteResultResponse::from)
                .toList();

        // 전체 수
        long sum = results.stream()
                .mapToLong(VoteResultResponse::getVoteCount)
                .sum();
        results.forEach(result -> result.calculateVoteRate(sum));

        return results;
    }

    private void validateUserBallot(String semester, Long userId) {
        long votedCount = ballotRepository.countBallotsBySemesterAndUserId(semester, userId);
        if (votedCount >= 3) {
            throw new IllegalArgumentException("[ERROR] 투표는 최대 3개까지 가능합니다.");
        }
    }

}
