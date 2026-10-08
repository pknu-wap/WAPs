package wap.web2.server.attendance.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(uniqueConstraints = @UniqueConstraint(name = "uk_attendance_user", columnNames = {"attendance_id", "user_id"}),
    indexes = @Index(name = "idx_attendance_participant_user", columnList = "user_id"))
public class AttendanceParticipant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attendance_id", nullable = false)
    private Attendance attendance;

    // 생성 시점의 명단을 보존하므로 이후 사용자 변경/삭제와 연동하지 않는다.
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String userName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PresenceStatus status = PresenceStatus.ABSENT;

    private Instant checkedInAt;

    @Column(nullable = false, length = 500)
    private String note = "";

    public AttendanceParticipant(Attendance attendance, Long userId, String userName) {
        this.attendance = attendance;
        this.userId = userId;
        this.userName = userName;
    }

    public void update(PresenceStatus status, String note, Instant now) {
        if (status != null && status != this.status) {
            this.status = status;
            checkedInAt = status == PresenceStatus.PRESENT ? now : null;
        }
        if (note != null) this.note = note;
    }
}
