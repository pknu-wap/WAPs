package wap.web2.server.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import wap.web2.server.attendance.dto.AttendanceRequests;
import wap.web2.server.attendance.dto.AttendanceResponses;
import wap.web2.server.attendance.dto.AttendanceResponses.*;
import wap.web2.server.attendance.entity.AttendanceStatus;
import wap.web2.server.attendance.entity.PresenceStatus;
import wap.web2.server.attendance.service.AttendanceService;
import wap.web2.server.exception.ErrorResponse;

@RestController
@RequestMapping(value = "/admin/attendances", produces = "application/json")
@Validated
@RequiredArgsConstructor
@Tag(name = "관리자 출석", description = "출석체크 생성·상태 변경, 현황·결과 조회, 수동 수정 및 QR 발급 (ADMIN)")
@ApiResponses({
    @ApiResponse(responseCode = "400", description = "입력값, 날짜 또는 정렬 조건이 잘못됨 (COMMON_INVALID_INPUT)",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(responseCode = "401", description = "로그인 토큰 누락·오류·만료 (AUTH_UNAUTHORIZED / AUTH_INVALID_TOKEN / AUTH_TOKEN_EXPIRED)",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(responseCode = "403", description = "관리자 권한이 없음 (AUTH_FORBIDDEN)",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
})
public class AdminAttendanceController {
    private final AttendanceService service;

    @PostMapping
    @Operation(operationId = "createAttendance", summary = "출석체크 생성", description = """
        생성 시 가입된 전체 사용자를 등급과 무관하게 출석 대상자로 고정하고 ABSENT로 등록합니다.
        title은 앞뒤 공백 제거 후 1~100자, date는 한국 시간(Asia/Seoul) 기준 오늘 또는 미래 날짜여야 합니다.
        생성 시 항상 SCHEDULED 상태이며, 날짜가 바뀌어도 자동으로 시작·종료하지 않습니다.
        진행 상태는 관리자가 PATCH /admin/attendances/{attendanceId}로 직접 변경합니다.
        """)
    @ApiResponse(responseCode = "201", description = "출석체크 생성 완료",
        headers = @Header(name = "Location", description = "생성한 출석체크 상세 조회 경로",
            schema = @Schema(type = "string", example = "/admin/attendances/1")),
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = Summary.class)))
    public ResponseEntity<Summary> create(@Valid @RequestBody AttendanceRequests.Create request) {
        Summary result = service.create(request);
        return ResponseEntity.created(URI.create("/admin/attendances/" + result.attendanceId())).body(result);
    }

    @GetMapping
    @Operation(operationId = "listAdminAttendances", summary = "출석체크 목록 조회", description = """
        상태별 출석체크와 출석·미출석 인원을 조회합니다. status를 생략하면 예정된 출석을 포함한 전체 목록을 반환합니다.
        date 내림차순, 같은 날짜이면 attendanceId 내림차순으로 정렬합니다.
        조건에 맞는 전체 목록을 반환하며, 결과가 없으면 content는 빈 배열입니다.
        """)
    @ApiResponse(responseCode = "200", description = "출석체크 목록")
    public AttendanceResponses.Content<Summary> list(
        @Parameter(description = "출석체크 진행 상태") @RequestParam(required = false) AttendanceStatus status
    ) {
        return service.listAdmin(status);
    }

    @GetMapping("/{attendanceId}")
    @Operation(operationId = "getAttendanceDetail", summary = "출석 현황·결과 및 대상자 명단 조회", description = """
        전체 대상자의 출석·미출석 인원과 대상자별 이름, 출석 상태, 출석 시각, 비고를 반환합니다.
        조건에 맞는 전체 명단을 반환하며, 결과가 없으면 participants.content는 빈 배열입니다.
        인원 집계는 출석 상태 필터와 무관하게 전체 대상자를 기준으로 합니다.
        status 오름차순은 PRESENT 먼저, 내림차순은 ABSENT 먼저입니다. 정렬 값이 같으면 userId 오름차순입니다.
        회원 등급에 따른 필드, 필터, 정렬은 사용하지 않습니다.
        """)
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "출석체크 요약 및 대상자 명단",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Detail.class))),
        @ApiResponse(responseCode = "404", description = "출석체크를 찾을 수 없음 (COMMON_RESOURCE_NOT_FOUND)",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public Detail detail(
        @Parameter(description = "출석체크 ID", example = "1", schema = @Schema(minimum = "1")) @PathVariable @Positive long attendanceId,
        @Parameter(description = "명단의 출석 상태 필터. 생략하면 전체 대상자를 조회합니다.")
        @RequestParam(required = false) PresenceStatus status,
        @Parameter(description = "명단 정렬 기준과 방향", schema = @Schema(
            allowableValues = {"userName,asc", "userName,desc", "status,asc", "status,desc"}, defaultValue = "userName,asc"))
        @RequestParam(defaultValue = "userName,asc") String sort
    ) {
        return service.detail(attendanceId, status, sort);
    }

    @PatchMapping("/{attendanceId}")
    @Operation(operationId = "updateAttendanceStatus", summary = "출석체크 진행 상태 변경", description = """
        관리자가 출석체크 상태를 SCHEDULED, ONGOING, ENDED 중 하나로 변경합니다.
        날짜와 무관하게 변경할 수 있으며, 종료 후 재시작하거나 예정 상태로 되돌릴 수 있습니다.
        ONGOING일 때만 QR 발급과 사용자 출석이 가능합니다. 날짜가 바뀌어도 지정한 상태는 유지됩니다.
        상태가 실제로 바뀌면 기존 QR은 즉시 무효화되므로 재시작 후 새 QR을 발급해야 합니다.
        같은 상태를 다시 전송하면 기존 QR을 유지합니다. 대상자 출석 기록과 비고는 유지됩니다.
        """)
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "변경된 출석체크 요약 및 출석·미출석 인원",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Summary.class))),
        @ApiResponse(responseCode = "404", description = "출석체크를 찾을 수 없음 (COMMON_RESOURCE_NOT_FOUND)",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public Summary changeStatus(
        @Parameter(description = "출석체크 ID", example = "1", schema = @Schema(minimum = "1")) @PathVariable @Positive long attendanceId,
        @Valid @RequestBody AttendanceRequests.ChangeStatus request
    ) {
        return service.changeStatus(attendanceId, request);
    }

    @PatchMapping("/{attendanceId}/users/{userId}")
    @Operation(operationId = "updateAttendanceParticipant", summary = "대상자 출석 상태·비고 수정", description = """
        진행 중이거나 종료된 출석의 상태 또는 비고를 수정합니다. 예정된 출석은 수정할 수 없습니다.
        status와 note 중 하나 이상을 전송해야 하며, 생략한 필드는 기존 값을 유지합니다. null은 허용하지 않습니다.
        ABSENT에서 PRESENT로 변경하면 checkedInAt은 서버의 현재 시각, ABSENT로 변경하면 null입니다.
        같은 status를 다시 전송하면 기존 checkedInAt을 유지합니다. 빈 문자열 note는 비고를 지웁니다.
        """)
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "수정된 출석 대상자 정보",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Participant.class))),
        @ApiResponse(responseCode = "404", description = "출석체크 또는 출석 대상자를 찾을 수 없음 (COMMON_RESOURCE_NOT_FOUND)",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "409", description = "아직 시작되지 않은 출석체크 (COMMON_CONFLICT)",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public Participant update(
        @Parameter(description = "출석체크 ID", example = "1", schema = @Schema(minimum = "1")) @PathVariable @Positive long attendanceId,
        @Parameter(description = "출석 대상자의 사용자 ID", example = "10", schema = @Schema(minimum = "1")) @PathVariable @Positive long userId,
        @Valid @RequestBody AttendanceRequests.Update request
    ) {
        return service.update(attendanceId, userId, request);
    }

    @PostMapping("/{attendanceId}/qr")
    @Operation(operationId = "issueAttendanceQr", summary = "출석 QR 발급·재발급", description = """
        ONGOING인 출석체크의 QR 토큰을 발급합니다.
        프런트엔드는 attendanceId와 qrToken을 JSON 문자열로 직렬화하여 QR 이미지로 표시합니다.
        예: {"attendanceId":1,"qrToken":"example-attendance-qr-token"}. QR 이미지 생성 및 카메라 스캔은 프런트엔드에서 처리합니다.
        QR에는 사용자 정보나 로그인 JWT를 넣지 않습니다. 추측 불가능한 출석 전용 난수만 사용합니다.
        유효 시간은 발급 시각부터 30초이며 재발급 시 이전 토큰은 즉시 무효화됩니다.
        출석체크의 상태가 변경되면 기존 QR은 즉시 무효화됩니다.
        동일 토큰을 여러 대상자가 사용할 수 있지만 사용자별 출석은 한 번만 기록합니다.
        """)
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "QR로 표시할 출석체크 ID, 토큰 및 만료 시각",
            headers = @Header(name = "Cache-Control", schema = @Schema(type = "string", allowableValues = "no-store")),
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Qr.class))),
        @ApiResponse(responseCode = "404", description = "출석체크를 찾을 수 없음 (COMMON_RESOURCE_NOT_FOUND)",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "409", description = "예정되었거나 종료되어 출석을 진행할 수 없음 (COMMON_CONFLICT)",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Qr> issueQr(
        @Parameter(description = "출석체크 ID", example = "1", schema = @Schema(minimum = "1")) @PathVariable @Positive long attendanceId
    ) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.issueQr(attendanceId));
    }
}
