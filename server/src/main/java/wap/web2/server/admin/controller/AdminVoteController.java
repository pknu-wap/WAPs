package wap.web2.server.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.admin.dto.request.VoteParticipants;
import wap.web2.server.admin.dto.request.VoteResultRequest;
import wap.web2.server.admin.dto.response.VoteStatusResponse;
import wap.web2.server.admin.service.AdminVoteService;
import wap.web2.server.security.core.CurrentUser;
import wap.web2.server.security.core.UserPrincipal;
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
                                           @RequestParam("semester") @Semester String semester,
                                           @RequestBody VoteResultRequest request) {
        adminVoteService.closeVote(semester, currentUser.getId(), request);
        return ResponseEntity.ok().build();
    }

}
