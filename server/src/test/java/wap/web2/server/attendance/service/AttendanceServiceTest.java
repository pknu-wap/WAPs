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
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;
import wap.web2.server.attendance.dto.AttendanceRequests;
import wap.web2.server.attendance.entity.*;
import wap.web2.server.attendance.repository.*;
import wap.web2.server.exception.*;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;

class AttendanceServiceTest {
    private final AttendanceRepository attendances = mock(AttendanceRepository.class);
    private final AttendanceParticipantRepository participants = mock(AttendanceParticipantRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final Clock clock = mock(Clock.class);
    private final AttendanceService service = new AttendanceService(attendances, participants, users, clock);
    private final Instant now = Instant.parse("2026-10-09T15:00:00.123456789Z");
    private final LocalDate today = LocalDate.of(2026, 10, 10);
    private final Attendance attendance = new Attendance("발표", today);

    @BeforeEach
    void setup() {
        when(clock.instant()).thenReturn(now);
        attendance.changeStatus(AttendanceStatus.ONGOING);
        ReflectionTestUtils.setField(attendance, "id", 1L);
        when(attendances.findById(1L)).thenReturn(Optional.of(attendance));
        when(attendances.findByIdForUpdate(1L)).thenReturn(Optional.of(attendance));
    }

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void creationSnapshotsEveryUserAsAbsentAndRejectsPastKoreanDates() {
        var first = new User(); first.setId(10L); first.setName("가");
        var second = new User(); second.setId(20L); second.setName("나");
        when(users.findAll()).thenReturn(List.of(first, second));
        when(attendances.save(any())).thenAnswer(call -> {
            Attendance a = call.getArgument(0);
            ReflectionTestUtils.setField(a, "id", 1L);
            return a;
        });
        var response = service.create(new AttendanceRequests.Create("  발표  ", today));
        assertThat(response.title()).isEqualTo("발표");
        assertThat(response.status()).isEqualTo(AttendanceStatus.SCHEDULED);
        assertThat(response.totalCount()).isEqualTo(2);
        assertThat(response.absentCount()).isEqualTo(2);
        ArgumentCaptor<List<AttendanceParticipant>> captured = ArgumentCaptor.forClass((Class) List.class);
        verify(participants).saveAll(captured.capture());
        assertThat(captured.getValue()).extracting(AttendanceParticipant::getUserId).containsExactly(10L, 20L);
        assertThat(captured.getValue()).allSatisfy(p -> {
            assertThat(p.getStatus()).isEqualTo(PresenceStatus.ABSENT);
            assertThat(p.getCheckedInAt()).isNull();
            assertThat(p.getNote()).isEmpty();
        });
        assertThatThrownBy(() -> service.create(new AttendanceRequests.Create("발표", today.minusDays(1))))
            .isInstanceOf(BadRequestException.class);
        verify(users, times(1)).findAll();
        when(users.findAll()).thenReturn(List.of());
        var empty = service.create(new AttendanceRequests.Create("미래", today.plusDays(1)));
        assertThat(empty.status()).isEqualTo(AttendanceStatus.SCHEDULED);
        assertThat(empty.totalCount()).isZero();
    }

    @Test
    void detailCountsAllTargetsAndSortsTiesByUserId() {
        var p3 = new AttendanceParticipant(attendance, 3L, "나");
        var p2 = new AttendanceParticipant(attendance, 2L, "가");
        var p1 = new AttendanceParticipant(attendance, 1L, "가");
        p1.update(PresenceStatus.PRESENT, null, now);
        when(participants.findByAttendanceId(1L)).thenReturn(List.of(p3, p2, p1));
        assertThat(service.detail(1, null, "userName,asc").participants().content())
            .extracting(p -> p.userId()).containsExactly(1L, 2L, 3L);
        assertThat(service.detail(1, null, "userName,desc").participants().content())
            .extracting(p -> p.userId()).containsExactly(3L, 1L, 2L);
        assertThat(service.detail(1, null, "status,asc").participants().content())
            .extracting(p -> p.userId()).containsExactly(1L, 2L, 3L);
        assertThat(service.detail(1, null, "status,desc").participants().content())
            .extracting(p -> p.userId()).containsExactly(2L, 3L, 1L);
        var filtered = service.detail(1, PresenceStatus.PRESENT, "userName,asc");
        assertThat(filtered.participants().content()).hasSize(1);
        assertThat(filtered.summary().totalCount()).isEqualTo(3);
        assertThat(filtered.summary().presentCount()).isEqualTo(1);
        assertThat(filtered.summary().absentCount()).isEqualTo(2);
        assertThatThrownBy(() -> service.detail(1, null, "role,asc")).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.detail(9, null, "userName,asc")).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void statusChangesReturnCountsWithoutChangingParticipantRecords() {
        var present = new AttendanceParticipant(attendance, 10L, "가");
        present.update(PresenceStatus.PRESENT, "확인", now);
        var absent = new AttendanceParticipant(attendance, 20L, "나");
        when(participants.findByAttendanceId(1)).thenReturn(List.of(present, absent));
        attendance.issueQr("token", now);
        var response = service.changeStatus(1, new AttendanceRequests.ChangeStatus(AttendanceStatus.ENDED));
        assertThat(response.status()).isEqualTo(AttendanceStatus.ENDED);
        assertThat(response.totalCount()).isEqualTo(2);
        assertThat(response.presentCount()).isEqualTo(1);
        assertThat(response.absentCount()).isEqualTo(1);
        assertThat(attendance.getQrToken()).isNull();
        assertThat(present.getCheckedInAt()).isEqualTo(now);
        assertThat(present.getNote()).isEqualTo("확인");
        assertThat(absent.getStatus()).isEqualTo(PresenceStatus.ABSENT);
        verify(attendances).findByIdForUpdate(1);
        assertThatThrownBy(() -> service.changeStatus(99, new AttendanceRequests.ChangeStatus(AttendanceStatus.ONGOING)))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void manualUpdatesPermitEndedAttendancesAndKeepOmittedFields() {
        var participant = new AttendanceParticipant(attendance, 10L, "가");
        when(participants.findByAttendanceIdAndUserId(1, 10)).thenReturn(Optional.of(participant));
        service.update(1, 10, new AttendanceRequests.Update(null, "확인"));
        var checkedIn = service.update(1, 10, new AttendanceRequests.Update(PresenceStatus.PRESENT, null));
        assertThat(checkedIn.checkedInAt()).isEqualTo(Instant.parse("2026-10-09T15:00:00.123456Z"));
        when(clock.instant()).thenReturn(now.plusSeconds(86400));
        attendance.changeStatus(AttendanceStatus.ENDED);
        var same = service.update(1, 10, new AttendanceRequests.Update(PresenceStatus.PRESENT, null));
        assertThat(same.checkedInAt()).isEqualTo(checkedIn.checkedInAt());
        assertThat(same.note()).isEqualTo("확인");
        var absent = service.update(1, 10, new AttendanceRequests.Update(PresenceStatus.ABSENT, ""));
        assertThat(absent.checkedInAt()).isNull();
        assertThat(absent.note()).isEmpty();
        assertThatThrownBy(() -> service.update(1, 99, new AttendanceRequests.Update(null, "확인")))
            .isInstanceOf(ResourceNotFoundException.class);
        when(clock.instant()).thenReturn(Instant.parse("2026-10-09T14:59:59Z"));
        attendance.changeStatus(AttendanceStatus.SCHEDULED);
        assertThatThrownBy(() -> service.update(1, 10, new AttendanceRequests.Update(PresenceStatus.PRESENT, null)))
            .isInstanceOf(ConflictException.class);
    }

    @Test
    void adminListsFilterStoredStatusRegardlessOfDate() {
        var counts = mock(AttendanceRepository.Counts.class);
        when(counts.getAttendanceId()).thenReturn(1L);
        when(counts.getTitle()).thenReturn("발표");
        when(counts.getDate()).thenReturn(today);
        when(counts.getStatus()).thenReturn(AttendanceStatus.ONGOING);
        when(counts.getTotalCount()).thenReturn(3L);
        when(counts.getPresentCount()).thenReturn(1L);
        when(attendances.findAllWithCounts(null)).thenReturn(List.of(counts));
        when(attendances.findAllWithCounts(AttendanceStatus.ONGOING)).thenReturn(List.of(counts));
        assertThat(service.listAdmin(null).content()).hasSize(1);
        assertThat(service.listAdmin(AttendanceStatus.ONGOING).content().get(0).absentCount()).isEqualTo(2);
        assertThat(service.listAdmin(AttendanceStatus.ENDED).content()).isEmpty();
        when(clock.instant()).thenReturn(Instant.parse("2026-10-10T15:00:00Z"));
        assertThat(service.listAdmin(AttendanceStatus.ONGOING).content()).hasSize(1);
        assertThat(service.listAdmin(AttendanceStatus.ENDED).content()).isEmpty();
        when(counts.getStatus()).thenReturn(AttendanceStatus.ENDED);
        when(attendances.findAllWithCounts(AttendanceStatus.ENDED)).thenReturn(List.of(counts));
        assertThat(service.listAdmin(AttendanceStatus.ENDED).content()).hasSize(1);
    }

    @Test
    void checkInRequiresTheLatestUnexpiredTokenEvenForPresentUsers() {
        var participant = new AttendanceParticipant(attendance, 10L, "가");
        when(participants.findByAttendanceIdAndUserId(1, 10)).thenReturn(Optional.of(participant));
        assertThatThrownBy(() -> service.checkIn(1, 10, "unissued")).isInstanceOf(BadRequestException.class);
        String old = service.issueQr(1).qrToken();
        String current = service.issueQr(1).qrToken();
        assertThat(current).isNotEqualTo(old);
        assertThatThrownBy(() -> service.checkIn(1, 10, old)).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.checkIn(1, 10, "forged")).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.checkIn(1, 99, current)).isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> service.checkIn(99, 10, current)).isInstanceOf(ResourceNotFoundException.class);
        var other = new Attendance("다른 행사", today);
        other.changeStatus(AttendanceStatus.ONGOING);
        when(attendances.findByIdForUpdate(2)).thenReturn(Optional.of(other));
        String otherToken = service.issueQr(2).qrToken();
        assertThatThrownBy(() -> service.checkIn(1, 10, otherToken)).isInstanceOf(BadRequestException.class);
        var result = service.checkIn(1, 10, current);
        assertThat(result.status()).isEqualTo(PresenceStatus.PRESENT);
        when(clock.instant()).thenReturn(now.plusSeconds(29));
        assertThat(service.checkIn(1, 10, current).checkedInAt()).isEqualTo(result.checkedInAt());
        when(clock.instant()).thenReturn(now.plusSeconds(30));
        assertThatThrownBy(() -> service.checkIn(1, 10, current)).isInstanceOf(BadRequestException.class);
        assertThat(participant.getCheckedInAt()).isEqualTo(result.checkedInAt());
    }

    @Test
    void midnightDoesNotCloseAnOngoingAttendance() {
        var participant = new AttendanceParticipant(attendance, 10L, "가");
        when(participants.findByAttendanceIdAndUserId(1, 10)).thenReturn(Optional.of(participant));
        when(clock.instant()).thenReturn(Instant.parse("2026-10-10T14:59:59Z"));
        String token = service.issueQr(1).qrToken();
        when(clock.instant()).thenReturn(Instant.parse("2026-10-10T15:00:00Z"));
        assertThat(service.checkIn(1, 10, token).status()).isEqualTo(PresenceStatus.PRESENT);
        assertThat(service.detail(1, null, "userName,asc").summary().status()).isEqualTo(AttendanceStatus.ONGOING);
        assertThat(service.issueQr(1).qrToken()).isNotBlank();
        // 예정 날짜 이전이어도 관리자가 시작한 출석은 진행 중이다.
        when(clock.instant()).thenReturn(Instant.parse("2026-10-09T14:59:59Z"));
        String early = service.issueQr(1).qrToken();
        assertThat(service.checkIn(1, 10, early).status()).isEqualTo(PresenceStatus.PRESENT);
    }

    @Test
    void scheduledAndEndedAttendancesRejectQrAndCheckInRegardlessOfDate() {
        for (AttendanceStatus status : List.of(AttendanceStatus.SCHEDULED, AttendanceStatus.ENDED)) {
            attendance.changeStatus(status);
            assertThatThrownBy(() -> service.checkIn(1, 10, "token")).isInstanceOf(ConflictException.class);
            assertThatThrownBy(() -> service.issueQr(1)).isInstanceOf(ConflictException.class);
        }
        verifyNoInteractions(participants);
    }

    @Test
    void userListsFilterScheduledOngoingAndEndedAttendances() {
        var ongoing = new AttendanceParticipant(attendance, 10L, "가");
        var ended = new AttendanceParticipant(new Attendance("과거", today.minusDays(1)), 10L, "가");
        ended.getAttendance().changeStatus(AttendanceStatus.ENDED);
        var future = new AttendanceParticipant(new Attendance("예정", today.plusDays(1)), 10L, "가");
        when(participants.findAllForUser(10, AttendanceStatus.SCHEDULED)).thenReturn(List.of(future));
        when(participants.findAllForUser(10, AttendanceStatus.ONGOING)).thenReturn(List.of(ongoing));
        when(participants.findAllForUser(10, AttendanceStatus.ENDED)).thenReturn(List.of(ended));
        when(clock.instant()).thenReturn(now.plusSeconds(86400 * 2));
        assertThat(service.listMine(10, AttendanceStatus.ONGOING)).extracting(a -> a.title()).containsExactly("발표");
        assertThat(service.listMine(10, AttendanceStatus.ENDED)).extracting(a -> a.title()).containsExactly("과거");
        var scheduled = service.listMine(10, AttendanceStatus.SCHEDULED);
        assertThat(scheduled).extracting(a -> a.title()).containsExactly("예정");
        assertThat(scheduled.get(0).status()).isEqualTo(AttendanceStatus.SCHEDULED);
        assertThat(scheduled.get(0).myStatus()).isEqualTo(PresenceStatus.ABSENT);
        assertThat(scheduled.get(0).checkedInAt()).isNull();
    }
}
