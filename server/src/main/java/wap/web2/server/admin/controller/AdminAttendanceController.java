package wap.web2.server.admin.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import wap.web2.server.attendance.dto.AttendanceRequests;
import wap.web2.server.attendance.dto.AttendanceResponses.*;
import wap.web2.server.attendance.entity.AttendanceStatus;
import wap.web2.server.attendance.entity.PresenceStatus;
import wap.web2.server.attendance.service.AttendanceService;

@RestController
@RequestMapping("/admin/attendances")
@Validated
@RequiredArgsConstructor
public class AdminAttendanceController {
    private final AttendanceService service;

    @PostMapping
    public ResponseEntity<Summary> create(@Valid @RequestBody AttendanceRequests.Create request) {
        Summary result = service.create(request);
        return ResponseEntity.created(URI.create("/admin/attendances/" + result.attendanceId())).body(result);
    }

    @GetMapping
    public Content<Summary> list(@RequestParam(required = false) AttendanceStatus status) {
        return service.listAdmin(status);
    }

    @GetMapping("/{attendanceId}")
    public Detail detail(@PathVariable @Positive long attendanceId,
                         @RequestParam(required = false) PresenceStatus status,
                         @RequestParam(defaultValue = "userName,asc") String sort) {
        return service.detail(attendanceId, status, sort);
    }

    @PatchMapping("/{attendanceId}/users/{userId}")
    public Participant update(@PathVariable @Positive long attendanceId, @PathVariable @Positive long userId,
                              @Valid @RequestBody AttendanceRequests.Update request) {
        return service.update(attendanceId, userId, request);
    }
}
