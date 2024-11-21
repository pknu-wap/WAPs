package wap.web2.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.domain.User;
import wap.web2.server.payload.response.UserResponse;
import wap.web2.server.repository.UserRepository;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.ouath2.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.service.UserService;

@RestController
@RequiredArgsConstructor
public class UserController {


    private final UserService userService;

    //자신의 회원 정보를 리턴
    @GetMapping("/user/me") //@CurrentUser : 프론트에서 주는 토큰을 가지고 객체를 만들어줌
    public ResponseEntity<?> findUserDetail(@CurrentUser UserPrincipal userPrincipal) {

        UserResponse response = userService.getUserDetail(userPrincipal);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
