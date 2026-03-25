package wap.web2.server.vote.controller;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.global.security.CurrentUser;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.util.Semester;
import wap.web2.server.util.SemesterGenerator;
import wap.web2.server.vote.dto.VoteInfoResponse;
import wap.web2.server.vote.dto.VoteParticipantsResponse;
import wap.web2.server.vote.dto.VoteRequest;
import wap.web2.server.vote.dto.VoteResultsResponse;
import wap.web2.server.vote.service.VoteService;

@RestController
@RequestMapping("/vote")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    @PostMapping
    public ResponseEntity<Void> voteProjects(@CurrentUser UserPrincipal userPrincipal,
                                             @RequestBody @Valid VoteRequest voteRequest) {
        voteService.vote(userPrincipal, voteRequest);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{semester}/projects")
    @Operation(summary = "투표 참여 프로젝트 목록 조회", description = "특정 학기 투표에 참여하는 프로젝트 목록을 조회합니다.")
    public ResponseEntity<List<VoteParticipantsResponse>> getVoteParticipants(
            @PathVariable("semester") @Semester String semester
    ) {
        List<VoteParticipantsResponse> participants = voteService.getParticipants(semester);
        return ResponseEntity.ok(participants);
    }

    @GetMapping("/now")
    @Operation(summary = "현재 학기 투표 상태 조회", description = "현재 학기 투표 여부와 투표 진행 상태를 조회합니다.")
    public ResponseEntity<VoteInfoResponse> getVoteInfo(@CurrentUser UserPrincipal userPrincipal) {
        String semester = SemesterGenerator.generateSemester();
        VoteInfoResponse response = voteService.getVoteInfo(userPrincipal, semester);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/result")
    @Operation(summary = "최신 투표 결과 조회", description = "가장 최신 공개 투표 결과를 조회합니다.")
    public ResponseEntity<VoteResultsResponse> getMostRecentResults() {
        VoteResultsResponse voteResults = voteService.getMostRecentResults();
        return ResponseEntity.ok(voteResults);
    }

    @GetMapping("/result/{semester}")
    @Operation(summary = "학기별 투표 결과 조회", description = "특정 학기의 투표 결과를 조회합니다.")
    public ResponseEntity<VoteResultsResponse> getVoteResults(@PathVariable("semester") @Semester String semester) {
        VoteResultsResponse voteResults = voteService.getVoteResults(semester);
        return ResponseEntity.ok(voteResults);
    }
}
