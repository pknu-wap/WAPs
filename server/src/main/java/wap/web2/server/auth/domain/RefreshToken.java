package wap.web2.server.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "refresh_token")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private Instant expiryDate;

    private RefreshToken(Long userId, String token, Instant expiryDate) {
        this.userId = userId;
        this.token = token;
        this.expiryDate = expiryDate;
    }

    public RefreshToken update(String token, long refreshTokenExpiry) {
        this.token = token;
        this.expiryDate = Instant.now().plusMillis(refreshTokenExpiry);
        return this;
    }

    public static RefreshToken of(Long userId, String refreshToken, long refreshTokenExpiry) {
        Instant expiryDate = Instant.now().plusMillis(refreshTokenExpiry);
        return new RefreshToken(userId, refreshToken, expiryDate);
    }

}
