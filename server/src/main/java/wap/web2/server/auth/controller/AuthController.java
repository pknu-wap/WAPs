package wap.web2.server.auth.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import wap.web2.server.auth.payload.ApiResponse;
import wap.web2.server.auth.payload.AuthResponse;
import wap.web2.server.auth.payload.LoginRequest;
import wap.web2.server.auth.payload.SignUpRequest;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.member.entity.AuthProvider;
import wap.web2.server.member.entity.RefreshToken;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.RefreshTokenRepository;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.security.config.AppProperties;
import wap.web2.server.security.core.UserPrincipal;
import wap.web2.server.security.jwt.TokenProvider;
import wap.web2.server.util.CookieUtils;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final TokenProvider tokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AppProperties appProperties;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String token = tokenProvider.createToken(authentication);
        return ResponseEntity.ok(new AuthResponse(token));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignUpRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new BadRequestException("Email address already in use.");
        }

        // Creating user's account
        User user = new User();
        user.setName(signUpRequest.getName());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(signUpRequest.getPassword());
        user.setProvider(AuthProvider.local);
        user.setRole(Role.ROLE_USER);

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        User result = userRepository.save(user);

        URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath().path("/user/me")
                .buildAndExpand(result.getId()).toUri();

        return ResponseEntity.created(location)
                .body(new ApiResponse(true, "User registered successfully@"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = CookieUtils.getCookie(request, "refresh_token")
                .map(Cookie::getValue)
                .orElseThrow(() -> new BadRequestException("Refresh Token not found"));

        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BadRequestException("Invalid Refresh Token");
        }

        RefreshToken token = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new BadRequestException("Refresh Token not found in database"));

        validateToken(token);
        Authentication authentication = createAuthentication(token);

        String newAccessToken = tokenProvider.createToken(authentication);
        String newRefreshToken = saveNewRefreshToken(token, authentication);

        addRefreshTokenCookieTo(response, newRefreshToken);
        return ResponseEntity.ok(new AuthResponse(newAccessToken));
    }

    private void addRefreshTokenCookieTo(HttpServletResponse response, String newRefreshToken) {
        long refreshTokenExpiry = appProperties.getAuth().getRefreshTokenExpirationMsec();
        int cookieMaxAge = (int) refreshTokenExpiry / 1000;

        CookieUtils.addCookie(response, "refresh_token", newRefreshToken, cookieMaxAge);
    }

    private String saveNewRefreshToken(RefreshToken token, Authentication authentication) {
        long refreshTokenExpiry = appProperties.getAuth().getRefreshTokenExpirationMsec();
        String newRefreshToken = tokenProvider.createRefreshToken(authentication);

        token.update(newRefreshToken, refreshTokenExpiry);
        refreshTokenRepository.save(token);

        return newRefreshToken;
    }

    private Authentication createAuthentication(RefreshToken token) {
        User user = token.getUser();
        UserPrincipal userPrincipal = UserPrincipal.create(user);
        return new UsernamePasswordAuthenticationToken(userPrincipal, null, userPrincipal.getAuthorities());
    }

    private void validateToken(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new BadRequestException("Refresh Token expired");
        }
    }

}
