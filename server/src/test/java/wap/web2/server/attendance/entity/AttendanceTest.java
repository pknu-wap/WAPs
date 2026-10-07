package wap.web2.server.attendance.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class AttendanceTest {
    private final LocalDate date = LocalDate.of(2026, 10, 10);
    private final Instant now = Instant.parse("2026-10-10T10:00:00Z");

    @Test
    void dateDeterminesStatusAndQrExpiresAtExactlyThirtySeconds() {
        var attendance = new Attendance("발표", date);
        assertThat(attendance.statusOn(date.minusDays(1))).isEqualTo(AttendanceStatus.SCHEDULED);
        assertThat(attendance.statusOn(date)).isEqualTo(AttendanceStatus.ONGOING);
        assertThat(attendance.statusOn(date.plusDays(1))).isEqualTo(AttendanceStatus.ENDED);
        assertThat(attendance.acceptsQr("first", now)).isFalse();
        attendance.issueQr("first", now);
        assertThat(attendance.acceptsQr("first", now.plusSeconds(29))).isTrue();
        assertThat(attendance.acceptsQr("first", now.plusSeconds(30))).isFalse();
        assertThat(attendance.acceptsQr("FIRST", now)).isFalse();
        attendance.issueQr("second", now.plusSeconds(1));
        assertThat(attendance.acceptsQr("first", now.plusSeconds(2))).isFalse();
        assertThat(attendance.acceptsQr("second", now.plusSeconds(2))).isTrue();
    }

    @Test
    void repeatedPresencePreservesTimeAndNoteWhileAbsenceClearsTime() {
        var participant = new AttendanceParticipant(new Attendance("발표", date), 1L, "이름");
        assertThat(participant.getStatus()).isEqualTo(PresenceStatus.ABSENT);
        assertThat(participant.getCheckedInAt()).isNull();
        assertThat(participant.getNote()).isEmpty();
        participant.update(null, "관리자 확인", now);
        participant.update(PresenceStatus.PRESENT, null, now);
        participant.update(PresenceStatus.PRESENT, null, now.plusSeconds(1));
        assertThat(participant.getCheckedInAt()).isEqualTo(now);
        assertThat(participant.getNote()).isEqualTo("관리자 확인");
        participant.update(null, "", now.plusSeconds(2));
        assertThat(participant.getCheckedInAt()).isEqualTo(now);
        assertThat(participant.getNote()).isEmpty();
        participant.update(PresenceStatus.ABSENT, null, now.plusSeconds(3));
        assertThat(participant.getCheckedInAt()).isNull();
        participant.update(PresenceStatus.PRESENT, null, now.plusSeconds(4));
        assertThat(participant.getCheckedInAt()).isEqualTo(now.plusSeconds(4));
    }
}
