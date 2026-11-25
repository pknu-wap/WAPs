package wap.web2.server.attendance.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import wap.web2.server.attendance.dto.AttendanceRequests;
import wap.web2.server.attendance.entity.*;
import wap.web2.server.attendance.repository.*;
import wap.web2.server.exception.ConflictException;
import wap.web2.server.member.repository.UserRepository;

class LateAttendanceTest {
    private final AttendanceRepository attendances = mock(AttendanceRepository.class);
    private final AttendanceParticipantRepository participants = mock(AttendanceParticipantRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final Instant firstCheckIn = Instant.parse("2026-11-23T10:00:00Z");
    private final Instant now = firstCheckIn.plusSeconds(60);
    private final AttendanceService service = new AttendanceService(
        attendances, participants, users, Clock.fixed(now, java.time.ZoneOffset.UTC));
    private final Attendance attendance = new Attendance("정기 회의", LocalDate.of(2026, 11, 23));
    private final AttendanceParticipant target = new AttendanceParticipant(attendance, 10L, "회원");

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(attendance, "id", 1L);
        attendance.changeStatus(AttendanceStatus.ENDED);
        when(attendances.findById(1L)).thenReturn(Optional.of(attendance));
        when(attendances.findByIdForUpdate(1L)).thenReturn(Optional.of(attendance));
        when(participants.findByAttendanceIdAndUserId(1L, 10L)).thenReturn(Optional.of(target));
    }

    @Test
    void endedAttendanceCanBeChangedToLateAndReadByAdminsAndTheUser() {
        target.update(PresenceStatus.PRESENT, "기존 비고", firstCheckIn);
        var saved = service.update(1, 10, new AttendanceRequests.Update(PresenceStatus.LATE, null));
        assertThat(saved.status()).isEqualTo(PresenceStatus.LATE);
        assertThat(saved.checkedInAt()).isEqualTo(firstCheckIn);
        assertThat(saved.note()).isEqualTo("기존 비고");
        var present = new AttendanceParticipant(attendance, 20L, "출석 회원");
        present.update(PresenceStatus.PRESENT, null, firstCheckIn);
        var absent = new AttendanceParticipant(attendance, 30L, "미출석 회원");
        when(participants.findByAttendanceId(1L)).thenReturn(List.of(target, absent, present));
        var detail = service.detail(1, PresenceStatus.LATE, "status,asc");
        assertThat(detail.participants().content()).extracting(p -> p.userId()).containsExactly(10L);
        assertThat(detail.summary().totalCount()).isEqualTo(3);
        assertThat(detail.summary().presentCount()).isEqualTo(1);
        assertThat(detail.summary().lateCount()).isEqualTo(1);
        assertThat(detail.summary().absentCount()).isEqualTo(1);
        assertThat(service.detail(1, null, "status,asc").participants().content())
            .extracting(p -> p.status()).containsExactly(PresenceStatus.PRESENT, PresenceStatus.LATE, PresenceStatus.ABSENT);
        when(participants.findAllForUser(10, AttendanceStatus.ENDED)).thenReturn(List.of(target));
        assertThat(service.listMine(10, AttendanceStatus.ENDED).get(0).myStatus()).isEqualTo(PresenceStatus.LATE);
    }

    @Test
    void listAndStatusChangeCountsKeepLateSeparateFromAbsence() {
        var listCounts = mock(AttendanceRepository.Counts.class);
        when(listCounts.getAttendanceId()).thenReturn(1L);
        when(listCounts.getStatus()).thenReturn(AttendanceStatus.ENDED);
        when(listCounts.getTotalCount()).thenReturn(3L);
        when(listCounts.getPresentCount()).thenReturn(1L);
        when(listCounts.getLateCount()).thenReturn(1L);
        when(attendances.findAllWithCounts(null)).thenReturn(List.of(listCounts));
        var listed = service.listAdmin(null).content().get(0);
        assertThat(listed.lateCount()).isEqualTo(1);
        assertThat(listed.absentCount()).isEqualTo(1);
        var counts = mock(AttendanceParticipantRepository.Counts.class);
        when(counts.getTotalCount()).thenReturn(3L);
        when(counts.getPresentCount()).thenReturn(1L);
        when(counts.getLateCount()).thenReturn(1L);
        when(participants.countForAttendance(1)).thenReturn(counts);
        var restarted = service.changeStatus(1, new AttendanceRequests.ChangeStatus(AttendanceStatus.ONGOING));
        assertThat(restarted.lateCount()).isEqualTo(1);
        assertThat(restarted.absentCount()).isEqualTo(1);
    }

    @Test
    void rescanningQrDoesNotOverwriteAnAdministratorsLateDecisionOrTheOriginalTime() {
        attendance.changeStatus(AttendanceStatus.ONGOING);
        attendance.issueQr("valid", now);
        target.update(PresenceStatus.LATE, "관리자 확인", firstCheckIn);
        var result = service.checkIn(1, 10, "valid");
        assertThat(result.status()).isEqualTo(PresenceStatus.LATE);
        assertThat(result.checkedInAt()).isEqualTo(firstCheckIn);
        assertThat(target.getNote()).isEqualTo("관리자 확인");
    }

    @Test
    void scheduledAttendanceStillRejectsManualLateChanges() {
        attendance.changeStatus(AttendanceStatus.SCHEDULED);
        assertThatThrownBy(() -> service.update(1, 10,
            new AttendanceRequests.Update(PresenceStatus.LATE, null))).isInstanceOf(ConflictException.class);
        assertThat(target.getStatus()).isEqualTo(PresenceStatus.ABSENT);
        verify(participants, never()).findByAttendanceIdAndUserId(anyLong(), anyLong());
    }

    @Test
    void presentAndLateCorrectionsKeepTheFirstTimeAndAbsenceClearsIt() {
        target.update(PresenceStatus.LATE, "비고", firstCheckIn);
        assertThat(target.getCheckedInAt()).isEqualTo(firstCheckIn);
        target.update(PresenceStatus.PRESENT, null, now);
        target.update(PresenceStatus.LATE, null, now.plusSeconds(1));
        assertThat(target.getCheckedInAt()).isEqualTo(firstCheckIn);
        target.update(PresenceStatus.ABSENT, null, now.plusSeconds(2));
        assertThat(target.getCheckedInAt()).isNull();
        target.update(PresenceStatus.LATE, null, now.plusSeconds(3));
        target.update(PresenceStatus.LATE, null, now.plusSeconds(4));
        assertThat(target.getCheckedInAt()).isEqualTo(now.plusSeconds(3));
        assertThat(target.getNote()).isEqualTo("비고");
    }
}
