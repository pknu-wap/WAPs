package wap.web2.server.attendance.service;

import static wap.web2.server.attendance.dto.AttendanceResponses.*;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
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
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.member.repository.UserRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceService {
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
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
        return summary(attendance, today, targets.size(), 0);
    }

    public Content<Summary> listAdmin(AttendanceStatus status) {
        LocalDate today = today(now());
        return new Content<>(attendances.findAllWithCounts().stream()
            .map(a -> new Summary(a.getAttendanceId(), a.getTitle(), a.getDate(), AttendanceStatus.on(a.getDate(), today),
                a.getTotalCount(), a.getPresentCount(), a.getTotalCount() - a.getPresentCount()))
            .filter(a -> status == null || a.status() == status).toList());
    }

    public Detail detail(long attendanceId, PresenceStatus status, String sort) {
        Comparator<AttendanceParticipant> order = participantOrder(sort);
        var attendance = attendances.findById(attendanceId).orElseThrow(AttendanceService::notFound);
        var targets = participants.findByAttendanceId(attendanceId);
        long present = targets.stream().filter(p -> p.getStatus() == PresenceStatus.PRESENT).count();
        return new Detail(summary(attendance, today(now()), targets.size(), present),
            new Content<>(targets.stream().filter(p -> status == null || p.getStatus() == status)
                .sorted(order).map(Participant::from).toList()));
    }

    @Transactional
    public Participant update(long attendanceId, long userId, AttendanceRequests.Update request) {
        var attendance = lockAttendance(attendanceId);
        Instant now = now();
        if (attendance.statusOn(today(now)) == AttendanceStatus.SCHEDULED) {
            throw new ConflictException("아직 시작되지 않은 출석체크입니다.");
        }
        var participant = participants.findByAttendanceIdAndUserId(attendanceId, userId)
            .orElseThrow(AttendanceService::notFound);
        participant.update(request.status(), request.note(), now);
        return Participant.from(participant);
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

    private static Summary summary(Attendance attendance, LocalDate today, long total, long present) {
        return new Summary(attendance.getId(), attendance.getTitle(), attendance.getDate(), attendance.statusOn(today),
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
