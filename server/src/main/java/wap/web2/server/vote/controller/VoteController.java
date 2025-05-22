package wap.web2.server.vote.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.vote.dto.VoteInfoResponse;
import wap.web2.server.vote.dto.VoteRequest;
import wap.web2.server.vote.service.VoteService;

@RestController
@RequestMapping("/vote")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    @PostMapping
    public ResponseEntity<?> voteProjects(@CurrentUser UserPrincipal userPrincipal,
                                          @RequestBody VoteRequest voteRequest) {
        try {
            voteService.processVote(userPrincipal, voteRequest);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/now")
    public ResponseEntity<?> getVoteInfo(@CurrentUser UserPrincipal userPrincipal,
                                         @RequestParam("projectYear") Integer year,
                                         @RequestParam("semester") Integer semester) {
        VoteInfoResponse voteInfo = voteService.getVoteInfo(userPrincipal, year, semester);
        return ResponseEntity.ok().body(voteInfo);
    }
}
