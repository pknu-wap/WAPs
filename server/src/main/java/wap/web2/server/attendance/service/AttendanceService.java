package wap.web2.server.attendance.service;

import static wap.web2.server.attendance.dto.AttendanceResponses.*;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.attendance.dto.AttendanceRequests;
import wap.web2.server.attendance.entity.Attendance;
import wap.web2.server.attendance.entity.AttendanceParticipant;
import wap.web2.server.attendance.entity.AttendanceStatus;
import wap.web2.server.attendance.entity.PresenceStatus;
import wap.web2.server.attendance.repository.AttendanceParticipantRepository;
import wap.web2.server.attendance.repository.AttendanceRepository;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.exception.ConflictException;
import wap.web2.server.exception.ForbiddenException;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.member.repository.UserRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceService {
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final SecureRandom RANDOM = new SecureRandom();
    private final AttendanceRepository attendances;
    private final AttendanceParticipantRepository participants;
    private final UserRepository users;
    private final Clock clock;

    @Transactional
    public Summary create(AttendanceRequests.Create request) {
        LocalDate today = today(now());
        if (request.date().isBefore(today)) {
            throw new BadRequestException("출석 날짜는 한국 시간 기준 오늘 또는 미래 날짜여야 합니다.");
        }
        var targets = users.findAll();
        var attendance = attendances.save(new Attendance(request.title(), request.date()));
        participants.saveAll(targets.stream()
            .map(user -> new AttendanceParticipant(attendance, user.getId(), user.getName())).toList());
        return summary(attendance, targets.size(), 0);
    }

    public Content<Summary> listAdmin(AttendanceStatus status) {
        return new Content<>(attendances.findAllWithCounts().stream()
            .map(a -> new Summary(a.getAttendanceId(), a.getTitle(), a.getDate(), a.getStatus(),
                a.getTotalCount(), a.getPresentCount(), a.getTotalCount() - a.getPresentCount()))
            .filter(a -> status == null || a.status() == status).toList());
    }

    public Detail detail(long attendanceId, PresenceStatus status, String sort) {
        Comparator<AttendanceParticipant> order = participantOrder(sort);
        var attendance = attendances.findById(attendanceId).orElseThrow(AttendanceService::notFound);
        var targets = participants.findByAttendanceId(attendanceId);
        long present = targets.stream().filter(p -> p.getStatus() == PresenceStatus.PRESENT).count();
        return new Detail(summary(attendance, targets.size(), present),
            new Content<>(targets.stream().filter(p -> status == null || p.getStatus() == status)
                .sorted(order).map(Participant::from).toList()));
    }

    @Transactional
    public Summary changeStatus(long attendanceId, AttendanceRequests.ChangeStatus request) {
        var attendance = lockAttendance(attendanceId);
        attendance.changeStatus(request.status());
        var targets = participants.findByAttendanceId(attendanceId);
        long present = targets.stream().filter(p -> p.getStatus() == PresenceStatus.PRESENT).count();
        return summary(attendance, targets.size(), present);
    }

    @Transactional
    public Participant update(long attendanceId, long userId, AttendanceRequests.Update request) {
        var attendance = lockAttendance(attendanceId);
        Instant now = now();
        if (attendance.getStatus() == AttendanceStatus.SCHEDULED) {
            throw new ConflictException("아직 시작되지 않은 출석체크입니다.");
        }
        var participant = participants.findByAttendanceIdAndUserId(attendanceId, userId)
            .orElseThrow(AttendanceService::notFound);
        participant.update(request.status(), request.note(), now);
        return Participant.from(participant);
    }

    @Transactional
    public Qr issueQr(long attendanceId) {
        var attendance = lockAttendance(attendanceId);
        Instant now = now();
        requireOngoing(attendance);
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        attendance.issueQr(Base64.getUrlEncoder().withoutPadding().encodeToString(bytes), now);
        return new Qr(attendance.getId(), attendance.getQrToken(), attendance.getQrExpiresAt());
    }

    public List<MyAttendance> listMine(long userId, AttendanceStatus status) {
        if (status != AttendanceStatus.ONGOING && status != AttendanceStatus.ENDED) {
            throw new BadRequestException("ONGOING 또는 ENDED 상태로 조회해 주세요.");
        }
        return participants.findAllForUser(userId).stream()
            .filter(p -> p.getAttendance().getStatus() == status)
            .map(p -> new MyAttendance(p.getAttendance().getId(), p.getAttendance().getTitle(),
                p.getAttendance().getDate(), status, p.getStatus(), p.getCheckedInAt())).toList();
    }

    @Transactional
    public CheckIn checkIn(long attendanceId, long userId, String qrToken) {
        var attendance = lockAttendance(attendanceId);
        Instant now = now();
        requireOngoing(attendance);
        var participant = participants.findByAttendanceIdAndUserId(attendanceId, userId)
            .orElseThrow(() -> new ForbiddenException("해당 출석체크의 대상자가 아닙니다."));
        if (!attendance.acceptsQr(qrToken, now)) {
            throw new BadRequestException("QR이 유효하지 않거나 만료되었습니다. 최신 QR을 다시 스캔해주세요.");
        }
        participant.update(PresenceStatus.PRESENT, null, now);
        return new CheckIn(attendanceId, userId, participant.getStatus(), participant.getCheckedInAt());
    }

    private static void requireOngoing(Attendance attendance) {
        if (attendance.getStatus() != AttendanceStatus.ONGOING) {
            throw new ConflictException("진행 중인 출석체크가 아닙니다.");
        }
    }

    private Attendance lockAttendance(long attendanceId) {
        // ponytail: 출석별 쓰기를 직렬화한다. 대규모 동시 출석이 필요하면 공유 QR 잠금과 대상자별 잠금으로 분리한다.
        return attendances.findByIdForUpdate(attendanceId).orElseThrow(AttendanceService::notFound);
    }

    private static Comparator<AttendanceParticipant> participantOrder(String sort) {
        Comparator<AttendanceParticipant> order = switch (sort) {
            case "userName,asc" -> Comparator.comparing(AttendanceParticipant::getUserName);
            case "userName,desc" -> Comparator.comparing(AttendanceParticipant::getUserName).reversed();
            case "status,asc" -> Comparator.comparing(AttendanceParticipant::getStatus);
            case "status,desc" -> Comparator.comparing(AttendanceParticipant::getStatus).reversed();
            default -> throw new BadRequestException("지원하지 않는 출석 명단 정렬 기준입니다.");
        };
        return order.thenComparing(AttendanceParticipant::getUserId);
    }

    private static Summary summary(Attendance attendance, long total, long present) {
        return new Summary(attendance.getId(), attendance.getTitle(), attendance.getDate(), attendance.getStatus(),
            total, present, total - present);
    }

    private Instant now() {
        return clock.instant().truncatedTo(ChronoUnit.MICROS);
    }

    private static LocalDate today(Instant now) {
        return now.atZone(SEOUL).toLocalDate();
    }

    private static ResourceNotFoundException notFound() {
        return new ResourceNotFoundException("요청한 출석체크 또는 출석 대상자를 찾을 수 없습니다.");
    }
}
