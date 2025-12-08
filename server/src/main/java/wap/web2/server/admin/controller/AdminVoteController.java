package wap.web2.server.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.admin.dto.request.VoteParticipants;
import wap.web2.server.admin.dto.response.AdminVoteResultResponse;
import wap.web2.server.admin.dto.response.VoteResultsVisibility;
import wap.web2.server.admin.dto.response.VoteStatusResponse;
import wap.web2.server.admin.service.AdminVoteService;
import wap.web2.server.auth.CurrentUser;
import wap.web2.server.auth.domain.UserPrincipal;
import wap.web2.server.util.Semester;

@RestController
@RequestMapping("/admin/vote")
@RequiredArgsConstructor
public class AdminVoteController {

    private final AdminVoteService adminVoteService;

    @GetMapping("/status")
    @Operation(summary = "투표 상태 확인",
            description = "희망하는 학기의 투표 상태를 확인합니다. 투표 상태에 따라 NOT_CREATED, VOTING, ENDED를 반환합니다.")
    public ResponseEntity<?> getStatus(@RequestParam("semester") @Semester String semester) {
        VoteStatusResponse response = adminVoteService.getStatus(semester);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/open")
    @Operation(summary = "투표 열기",
            description = "희망하는 학기의 투표를 생성합니다. 혹은 희망하는 학기의 투표를 엽니다. 이제 투표를 진행할 수 있습니다.")
    public ResponseEntity<?> openVoteMeta(@CurrentUser UserPrincipal currentUser,
                                          @RequestBody VoteParticipants voteParticipants,
                                          @RequestParam("semester") @Semester String semester) {
        adminVoteService.openVote(semester, currentUser.getId(), voteParticipants);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/closed")
    @Operation(summary = "투표 닫기", description = "희망하는 학기의 투표를 닫습니다. 그럼 더이상 투표를 진행할 수 없습니다.")
    public ResponseEntity<?> closeVoteMeta(@CurrentUser UserPrincipal currentUser,
                                           @RequestParam("semester") @Semester String semester) {
        adminVoteService.closeVote(semester, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/result")
    @Operation(summary = "투표 결과 공개 여부 결정", description = "투표 결과를 공개하거나 비공개하는 요청입니다.")
    public ResponseEntity<?> changeVoteResultStatus(@RequestParam("semester") @Semester String semester,
                                                    @RequestParam("status") Boolean status) {
        adminVoteService.changeResultStatus(semester, status);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{semester}/results")
    @Operation(summary = "실시간 투표 결과 확인", description = "진행 중인 투표의 실시간 현황을 확인합니다.")
    public ResponseEntity<?> getRealTimeVoteResult(@PathVariable("semester") @Semester String semester) {
        List<AdminVoteResultResponse> response = adminVoteService.getVoteResult(semester);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{semester}/results/visibility")
    @Operation(summary = "투표 결과 공개여부 확인", description = "투표 결과가 공개인지 비공개인지 반환합니다.")
    public ResponseEntity<?> getVoteResultVisibility(@PathVariable("semester") @Semester String semester) {
        VoteResultsVisibility response = adminVoteService.getVisibility(semester);
        return ResponseEntity.ok(response);
    }

}
