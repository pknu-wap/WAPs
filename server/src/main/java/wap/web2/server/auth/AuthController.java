package wap.web2.server.auth;

import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import wap.web2.server.auth.domain.Tokens;
import wap.web2.server.auth.dto.ApiResponse;
import wap.web2.server.auth.dto.AuthResponse;
import wap.web2.server.auth.dto.LoginRequest;
import wap.web2.server.auth.dto.SignUpRequest;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.global.security.config.AppProperties;
import wap.web2.server.global.security.jwt.TokenProvider;
import wap.web2.server.member.entity.AuthProvider;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final TokenProvider tokenProvider;
    private final AppProperties appProperties;
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticateUser(
        @Valid @RequestBody LoginRequest loginRequest
    ) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getEmail(),
                loginRequest.getPassword()
            )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String token = tokenProvider.createToken(authentication);
        return ResponseEntity.ok(new AuthResponse(token));
    }

    @PostMapping("/signup")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse> registerUser(
        @Valid @RequestBody SignUpRequest signUpRequest
    ) {
        User user = userRepository.findByEmail(signUpRequest.getEmail()).orElse(null);
        if (user != null) {
            user = userRepository.findByIdForUpdate(user.getId()).orElseThrow();
            if (!user.isDeleted()) throw new BadRequestException("이미 사용 중인 이메일입니다.");
            // Local signup has no email verification: possession of the old password is required.
            if (user.getProvider() != AuthProvider.local || user.getPassword() == null
                || !passwordEncoder.matches(signUpRequest.getPassword(), user.getPassword())) {
                throw new BadRequestException("기존 계정의 로그인 방식으로 본인 확인 후 재가입해 주세요.");
            }
            user.reactivate();
            user.setSignupCompleted(true);
        } else {
            user = new User();
        }
        user.setName(signUpRequest.getName());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(signUpRequest.getPassword());
        user.setProvider(AuthProvider.local);
        user.setRole(Role.ROLE_GUEST);

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        User result = userRepository.save(user);

        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
            .path("/user/me")
            .buildAndExpand(result.getId())
            .toUri();

        return ResponseEntity.created(location).body(
            new ApiResponse(true, "회원가입이 완료되었습니다.")
        );
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
        @CookieValue(name = "refresh_token") String refreshToken
    ) {
        Tokens newTokens = authService.createNewToken(refreshToken);

        long refreshTokenExpiry = appProperties.getAuth().getRefreshTokenExpirationMsec();
        int cookieMaxAge = (int) refreshTokenExpiry / 1000;

        ResponseCookie cookie = ResponseCookie.from("refresh_token", newTokens.refreshToken())
            .httpOnly(true)
            .secure(true)
            .path("/")
            .maxAge(cookieMaxAge)
            .sameSite("None")
            .build();

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(new AuthResponse(newTokens.accessToken()));
    }
}
