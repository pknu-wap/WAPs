package wap.web2.server.vote.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.security.core.CurrentUser;
import wap.web2.server.security.core.UserPrincipal;
import wap.web2.server.vote.dto.VoteInfoResponse;
import wap.web2.server.vote.dto.VoteRequest;
import wap.web2.server.vote.dto.VoteResultResponse;
import wap.web2.server.vote.service.VoteService;

@RestController
@RequestMapping("/vote")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    // TODO: Vote자체를 생성하는 api 개발 필요

    @PostMapping
    public ResponseEntity<?> voteProjects(@CurrentUser UserPrincipal userPrincipal,
                                          @RequestBody @Valid VoteRequest voteRequest) {
        try {
            voteService.processVote(userPrincipal.getId(), voteRequest);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // TODO: fe에서 2번의 요청을 통한 분기처리로 확인하던것을, 오류코드를 반환하는 식으로 개선해서 1번의 요청으로 줄일 수 있을 듯
    @GetMapping("/now")
    public ResponseEntity<?> getVoteInfo(@CurrentUser UserPrincipal userPrincipal,
                                         @RequestParam(value = "projectYear", required = false) Integer year,
                                         @RequestParam(value = "semester", required = false) Integer semester) {
        VoteInfoResponse voteInfo = voteService.getVoteInfo(userPrincipal, year, semester);
        return ResponseEntity.ok().body(voteInfo);
    }

    @GetMapping("/result")
    public ResponseEntity<?> getVoteResults(@RequestParam(value = "projectYear", required = false) Integer year,
                                            @RequestParam(value = "semester", required = false) Integer semester) {
        try {
            List<VoteResultResponse> voteResults = voteService.getVoteResults(year, semester);
            return ResponseEntity.ok().body(voteResults);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 조회 실패");
        }
    }

}
