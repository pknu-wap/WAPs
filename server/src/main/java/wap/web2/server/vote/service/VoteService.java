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
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.security.core.UserPrincipal;
import wap.web2.server.util.SemesterGenerator;
import wap.web2.server.vote.dto.VoteInfoResponse;
import wap.web2.server.vote.dto.VoteRequest;
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

    private final VoteResultRepository voteResultRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final BallotRepository ballotRepository;
    private final VoteMetaRepository voteMetaRepository;

    // Transactional인 메서드에서 투표 실시, marking user vote 가 들어있어야 transactional 하게 처리할 수 있다.
    // 투표는 '현재 년도&학기'에 '열려있는' 상태에만 가능하다.
    @Transactional
    public void processVote(Long userId, VoteRequest voteRequest) {
        Integer year = SemesterGenerator.generateYearValue();
        Integer semester = SemesterGenerator.generateSemesterValue();

        Vote vote = voteRepository.findVoteByYearAndSemester(year, semester)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지않는 투표입니다."));
        if (!vote.isOpen()) {
            throw new IllegalStateException("[ERROR] 종료된 투표입니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));
        if (!user.canVote()) {
            throw new IllegalStateException("[ERROR] 투표를 이미 완료했습니다.");
        }

        vote(voteRequest, vote.getId());
        markVoted(user.getId());
        user.updateVotedProjectIds(voteRequest);
    }

    @Transactional
    public void vote(Long userId, Role userRole, VoteRequest2 voteRequest) {
        String semester = voteRequest.semester();

        if (voteMetaRepository.findStatusBySemester(semester) == VoteStatus.OPEN) {
            for (Long projectId : voteRequest.projectIds()) {
                ballotRepository.save(Ballot.of(semester, userId, userRole, projectId));
            }
        }
    }

    @Transactional(readOnly = true)
    public VoteInfoResponse getVoteInfo(UserPrincipal userPrincipal, Integer year, Integer semester) {
        if (year == null || semester == null) {
            year = SemesterGenerator.generateYearValue();
            semester = SemesterGenerator.generateSemesterValue();
        }

        Vote vote = voteRepository.findVoteByYearAndSemester(year, semester)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지않는 투표입니다."));
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 존재하지 않는 사용자입니다."));

        return new VoteInfoResponse(vote.getIsOpen(), user.getVoted());
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

    // TODO: SQL 쿼리를 직접 날려서 스레스 안전을 보장하는 방법말고도 해보기!!!
    //  https://tecoble.techcourse.co.kr/post/2023-08-16-concurrency-managing/ 참고
    private void vote(VoteRequest voteRequest, Long voteId) {
        for (Long projectId : voteRequest.getProjectIds()) {
            int updated = voteResultRepository.incrementVoteCount(voteId, projectId);
            if (updated == 0) {
                throw new IllegalArgumentException("[ERROR] 존재하지 않는 투표 대상입니다. projectId=" + projectId);
            }
        }
    }

    @Deprecated
    private void vote(VoteRequest voteRequest) {
        for (Long projectId : voteRequest.getProjectIds()) {
            int updated = projectRepository.voteByProjectId(projectId);
            if (updated == 0) {
                throw new IllegalArgumentException("[ERROR] 존재하지 않는 프로젝트입니다. projectId : " + projectId);
            }
        }
    }

    private void markVoted(Long userId) {
        userRepository.updateVotedTrueByUserId(userId);
    }

}
