package wap.web2.server.vote.controller;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.global.security.CurrentUser;
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
    public ResponseEntity<?> voteProjects(@CurrentUser UserPrincipal userPrincipal,
                                          @RequestBody @Valid VoteRequest voteRequest) {
        try {
            String role = userPrincipal.getUserRole()
                    .orElseThrow(() -> new IllegalArgumentException("[ERROR] 사용자의 권한 정보가 존재하지 않습니다."));

            voteService.vote(userPrincipal.getId(), role, voteRequest);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/{semester}/projects")
    @Operation(summary = "투표에 참여하는 프로젝트 리스트", description = "특정 학기 투표에 참여하는 프로젝트 리스트를 가져옵니다.")
    public ResponseEntity<?> getVoteParticipants(@PathVariable("semester") @Semester String semester) {
        List<VoteParticipantsResponse> participants = voteService.getParticipants(semester);
        return ResponseEntity.ok(participants);
    }

    @GetMapping("/now")
    @Operation(summary = "현재 학기 투표 상태 보기", description = "현재 학기에 '열린 투표'인지, '내가 투표했는지', '닫힌 투표인지'를 반환한다")
    public ResponseEntity<?> getVoteInfo(@CurrentUser UserPrincipal userPrincipal) {
        try {
            // 해당 api는 "현재 학기"로 고정이다.
            String semester = SemesterGenerator.generateSemester();
            VoteInfoResponse response = voteService.getVoteInfo(userPrincipal, semester);
            return ResponseEntity.ok().body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/result")
    @Operation(summary = "최신 투표 결과 확인", description = "가장 최신의 투표 결과를 반환한다. 현재 학기 투표 결과가 없다면 이전 학기 중 가장 가까운 학기의 결과를 가져온다.")
    public ResponseEntity<?> getMostRecentResults() {
        VoteResultsResponse voteResults = voteService.getMostRecentResults();
        return ResponseEntity.ok().body(voteResults);
    }

    @GetMapping("/result/{semester}")
    @Operation(summary = "특정 학기 투표 결과 확인", description = "특정 학기의 투표 결과를 가져온다.")
    public ResponseEntity<?> getVoteResults(@PathVariable("semester") @Semester String semester) {
        VoteResultsResponse voteResults = voteService.getVoteResults(semester);
        return ResponseEntity.ok().body(voteResults);
    }

}
