package wap.web2.server.auth;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.auth.domain.RefreshToken;
import wap.web2.server.auth.domain.Tokens;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.global.security.config.AppProperties;
import wap.web2.server.global.security.jwt.TokenProvider;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TokenProvider tokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final AppProperties appProperties;

    @Transactional
    public Tokens createNewToken(String token) {
        if (!tokenProvider.validateToken(token)) {
            throw new BadRequestException("Invalid Refresh Token");
        }

        RefreshToken refreshToken = refreshTokenRepository.findByToken(token).orElse(null);

        if (refreshToken == null) {
            handleTokenTheft(token);
            throw new BadRequestException("Refresh Token reuse detected");
        }

        validateToken(refreshToken);
        Authentication authentication = createAuthentication(refreshToken);

        String newAccessToken = tokenProvider.createToken(authentication);
        String newRefreshToken = tokenProvider.createRefreshToken(authentication);

        saveNewRefreshToken(refreshToken, newRefreshToken);
        return new Tokens(newAccessToken, newRefreshToken);
    }

    private void handleTokenTheft(String token) {
        Long userId = tokenProvider.getUserIdFromToken(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        refreshTokenRepository.deleteByUser(user);
    }

    private void saveNewRefreshToken(RefreshToken token, String newRefreshToken) {
        long refreshTokenExpiry = appProperties.getAuth().getRefreshTokenExpirationMsec();
        token.update(newRefreshToken, refreshTokenExpiry);
        refreshTokenRepository.save(token);
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
