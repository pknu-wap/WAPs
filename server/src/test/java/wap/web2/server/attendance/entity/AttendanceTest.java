package wap.web2.server.attendance.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class AttendanceTest {
    private final LocalDate date = LocalDate.of(2026, 10, 10);
    private final Instant now = Instant.parse("2026-10-10T10:00:00Z");

    @Test
    void creationIsAlwaysScheduledRegardlessOfDate() {
        for (LocalDate day : new LocalDate[]{date.minusDays(1), date, date.plusDays(1)}) {
            assertThat(new Attendance("발표", day).getStatus()).isEqualTo(AttendanceStatus.SCHEDULED);
        }
    }

    @Test
    void qrExpiresAtExactlySixtySeconds() {
        var attendance = new Attendance("발표", date);
        assertThat(attendance.acceptsQr("first", now)).isFalse();
        attendance.issueQr("first", now);
        assertThat(attendance.getQrExpiresAt()).isEqualTo(now.plusSeconds(60));
        assertThat(attendance.acceptsQr("first", now.plusSeconds(60).minusNanos(1))).isTrue();
        assertThat(attendance.acceptsQr("first", now.plusSeconds(60))).isFalse();
        assertThat(attendance.acceptsQr("FIRST", now)).isFalse();
        assertThat(attendance.acceptsQr(null, now)).isFalse();
    }

    @Test
    void reissuePreservesThePreviousTokensOriginalExpiry() {
        var attendance = new Attendance("발표", date);
        attendance.issueQr("first", now);
        attendance.issueQr("second", now.plusSeconds(30));
        assertThat(attendance.acceptsQr("first", now.plusSeconds(60).minusNanos(1))).isTrue();
        assertThat(attendance.acceptsQr("second", now.plusSeconds(60).minusNanos(1))).isTrue();
        assertThat(attendance.acceptsQr("FIRST", now.plusSeconds(30))).isFalse();
        assertThat(attendance.acceptsQr("first", now.plusSeconds(60))).isFalse();
        assertThat(attendance.acceptsQr("second", now.plusSeconds(60))).isTrue();
        assertThat(attendance.acceptsQr("second", now.plusSeconds(90))).isFalse();
    }

    @Test
    void aThirdIssueDiscardsTheOldestTokenEvenBeforeExpiry() {
        var attendance = new Attendance("발표", date);
        attendance.issueQr("first", now);
        attendance.issueQr("second", now.plusSeconds(10));
        attendance.issueQr("third", now.plusSeconds(20));
        assertThat(attendance.acceptsQr("first", now.plusSeconds(20))).isFalse();
        assertThat(attendance.acceptsQr("second", now.plusSeconds(20))).isTrue();
        assertThat(attendance.acceptsQr("third", now.plusSeconds(20))).isTrue();
    }

    @Test
    void reissueDoesNotReviveAnExpiredToken() {
        var attendance = new Attendance("발표", date);
        attendance.issueQr("first", now);
        attendance.issueQr("second", now.plusSeconds(60));
        assertThat(attendance.acceptsQr("first", now.plusSeconds(60))).isFalse();
        assertThat(attendance.acceptsQr("second", now.plusSeconds(60))).isTrue();
    }

    @Test
    void changingStatusInvalidatesQrButRepeatingTheSameStatusPreservesIt() {
        var attendance = new Attendance("발표", date);
        attendance.changeStatus(AttendanceStatus.ONGOING);
        attendance.issueQr("previous", now);
        attendance.issueQr("token", now);
        attendance.changeStatus(AttendanceStatus.ONGOING);
        assertThat(attendance.acceptsQr("previous", now)).isTrue();
        assertThat(attendance.acceptsQr("token", now)).isTrue();
        attendance.changeStatus(AttendanceStatus.ENDED);
        assertThat(attendance.getStatus()).isEqualTo(AttendanceStatus.ENDED);
        assertThat(attendance.getQrToken()).isNull();
        assertThat(attendance.getQrExpiresAt()).isNull();
        assertThat(attendance.getPreviousQrToken()).isNull();
        assertThat(attendance.getPreviousQrExpiresAt()).isNull();
        attendance.changeStatus(AttendanceStatus.ONGOING);
        assertThat(attendance.acceptsQr("previous", now)).isFalse();
        assertThat(attendance.acceptsQr("token", now)).isFalse();
        attendance.issueQr("new-previous", now);
        attendance.issueQr("new-token", now);
        attendance.changeStatus(AttendanceStatus.SCHEDULED);
        assertThat(attendance.acceptsQr("new-previous", now)).isFalse();
        assertThat(attendance.acceptsQr("new-token", now)).isFalse();
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
