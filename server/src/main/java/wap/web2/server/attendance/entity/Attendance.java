package wap.web2.server.attendance.entity;

import jakarta.persistence.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(indexes = @Index(name = "idx_attendance_date", columnList = "date,id"))
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AttendanceStatus status = AttendanceStatus.SCHEDULED;

    @Column(length = 43)
    private String qrToken;

    private Instant qrExpiresAt;

    @Column(length = 43)
    private String previousQrToken;

    private Instant previousQrExpiresAt;

    public Attendance(String title, LocalDate date) {
        this.title = title;
        this.date = date;
    }

    public void changeStatus(AttendanceStatus status) {
        if (this.status == status) return;
        this.status = status;
        qrToken = null;
        qrExpiresAt = null;
        previousQrToken = null;
        previousQrExpiresAt = null;
    }

    public void issueQr(String token, Instant now) {
        previousQrToken = qrToken;
        previousQrExpiresAt = qrExpiresAt;
        qrToken = token;
        qrExpiresAt = now.plusSeconds(60);
    }

    public boolean acceptsQr(String token, Instant now) {
        return matchesQr(qrToken, qrExpiresAt, token, now)
            || matchesQr(previousQrToken, previousQrExpiresAt, token, now);
    }

    private static boolean matchesQr(String storedToken, Instant expiresAt, String token, Instant now) {
        return storedToken != null && token != null && expiresAt != null && now.isBefore(expiresAt)
            && MessageDigest.isEqual(storedToken.getBytes(StandardCharsets.UTF_8),
                token.getBytes(StandardCharsets.UTF_8));
    }
}
