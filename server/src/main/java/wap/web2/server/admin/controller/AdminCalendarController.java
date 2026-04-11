package wap.web2.server.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.admin.dto.request.CalendarEventPostingRequest;
import wap.web2.server.admin.service.AdminCalendarService;

@RestController
@RequestMapping("/admin/calendar")
@RequiredArgsConstructor
public class AdminCalendarController {

    private final AdminCalendarService adminCalendarService;

    @PostMapping("/event")
    @Operation(summary = "일정 등록", description = "관리자 일정 이벤트를 등록합니다.")
    public ResponseEntity<String> postCalendarEvent(@RequestBody @Valid CalendarEventPostingRequest request) {
        adminCalendarService.postCalendarEvent(request);
        return ResponseEntity.ok("일정이 등록되었습니다.");
    }
}
