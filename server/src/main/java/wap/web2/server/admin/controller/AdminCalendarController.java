package wap.web2.server.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.admin.dto.CalendarEventPostingRequest;
import wap.web2.server.admin.service.AdminCalendarService;

@RestController
@RequestMapping("/admin/calendar")
@RequiredArgsConstructor
public class AdminCalendarController {

    private final AdminCalendarService adminCalendarService;

    @PostMapping("/event")
    @Operation(summary = "일정 등록하기", description = "왑에서 진행될 일정을 등록합니다.")
    public ResponseEntity<?> postCalendarEvent(@RequestBody CalendarEventPostingRequest request) {
        try {
            adminCalendarService.postCalendarEvent(request);
            return ResponseEntity.ok().body("[INFO ] 성공적으로 일정을 등록하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 등록 실패");
        }
    }

}
