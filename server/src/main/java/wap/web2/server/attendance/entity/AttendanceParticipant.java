package wap.web2.server.attendance.entity;

import jakarta.persistence.*;
import wap.web2.server.member.entity.MembershipLevel;
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

    // 생성 시점의 명단을 보존한다. 표시 이름은 현재 사용자 이름을 우선하고 삭제 시 저장된 이름을 사용한다.
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String userName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MembershipLevel membershipLevel = MembershipLevel.NONE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PresenceStatus status = PresenceStatus.ABSENT;

    private Instant checkedInAt;

    @Column(nullable = false, length = 500)
    private String note = "";

    public AttendanceParticipant(Attendance attendance, Long userId, String userName) {
        this(attendance, userId, userName, MembershipLevel.NONE);
    }

    public AttendanceParticipant(Attendance attendance, Long userId, String userName, MembershipLevel membershipLevel) {
        this.membershipLevel = membershipLevel;
        this.attendance = attendance;
        this.userId = userId;
        this.userName = userName;
    }

    public void update(PresenceStatus status, String note, Instant now) {
        if (status != null && status != this.status) {
            this.status = status;
            if (status == PresenceStatus.ABSENT) checkedInAt = null;
            else if (checkedInAt == null) checkedInAt = now;
        }
        if (note != null) this.note = note;
    }
}
