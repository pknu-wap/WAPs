package wap.web2.server.attendance.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import wap.web2.server.attendance.dto.AttendanceRequests;
import wap.web2.server.attendance.dto.AttendanceResponses.*;
import wap.web2.server.attendance.entity.AttendanceStatus;
import wap.web2.server.attendance.service.AttendanceService;
import wap.web2.server.global.security.CurrentUser;
import wap.web2.server.global.security.UserPrincipal;

@RestController
@RequestMapping("/attendances")
@Validated
@RequiredArgsConstructor
public class AttendanceController {
    private final AttendanceService service;

    @GetMapping
    public List<MyAttendance> list(@CurrentUser UserPrincipal user,
                                   @RequestParam(defaultValue = "ONGOING") AttendanceStatus status) {
        return service.listMine(user.getId(), status);
    }

    @PostMapping("/{attendanceId}/check-in")
    public CheckIn checkIn(@PathVariable @Positive long attendanceId, @CurrentUser UserPrincipal user,
                           @Valid @RequestBody AttendanceRequests.CheckIn request) {
        return service.checkIn(attendanceId, user.getId(), request.qrToken());
    }
}
