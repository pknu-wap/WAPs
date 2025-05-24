package wap.web2.server.member.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.member.dto.UserResponse;
import wap.web2.server.member.dto.UserVoteResponse;
import wap.web2.server.member.service.UserService;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.ouath2.security.UserPrincipal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {

    private final UserService userService;

    // 자신의 회원 정보를 리턴
    @GetMapping("/me") // @CurrentUser : 프론트에서 주는 토큰을 가지고 객체를 만들어줌
    public ResponseEntity<?> findUserDetail(@CurrentUser UserPrincipal userPrincipal) {
        UserResponse response = userService.getUserDetail(userPrincipal);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/vote")
    public ResponseEntity<?> getMyVotedInfo(@CurrentUser UserPrincipal userPrincipal) {
        UserVoteResponse response = userService.getUserVotedInfo(userPrincipal);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

}
