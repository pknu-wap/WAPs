package wap.web2.server.attendance.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
import wap.web2.server.exception.ErrorResponse;
import wap.web2.server.global.security.CurrentUser;
import wap.web2.server.global.security.UserPrincipal;

@RestController
@RequestMapping(value = "/attendances", produces = "application/json")
@Validated
@RequiredArgsConstructor
@Tag(name = "사용자 출석", description = "예정·진행 중인 출석 및 나의 출석 기록 조회, QR 출석 등록 (로그인 필요, 회원 등급 제한 없음)")
@ApiResponses({
    @ApiResponse(responseCode = "400", description = "잘못된 입력 (COMMON_INVALID_INPUT)",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(responseCode = "401", description = "로그인 토큰 누락·오류·만료 (AUTH_UNAUTHORIZED / AUTH_INVALID_TOKEN / AUTH_TOKEN_EXPIRED)",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
})
public class AttendanceController {
    private final AttendanceService service;

    @GetMapping
    @Operation(operationId = "listMyAttendances", summary = "예정·진행 중인 출석 및 나의 출석 기록 조회", description = """
        로그인 사용자가 대상자인 출석체크와 본인의 출석 상태를 반환합니다.
        예정된 출석은 SCHEDULED, 진행 중인 출석은 ONGOING, 종료된 기록은 ENDED로 요청합니다. 생략하면 ONGOING입니다.
        사용자 ID는 JWT에서 확인하며 요청 파라미터로 받지 않습니다.
        date 내림차순, 같은 날짜이면 attendanceId 내림차순으로 조건에 맞는 전체 목록을 반환하며, 결과가 없으면 빈 배열입니다.
        """)
    @ApiResponse(responseCode = "200", description = "출석체크 정보와 본인의 출석 상태를 포함한 카드 목록")
    public List<MyAttendance> list(
        @Parameter(hidden = true) @CurrentUser UserPrincipal user,
        @Parameter(description = "예정·진행 중인 출석 또는 종료된 나의 출석 기록 선택",
            schema = @Schema(type = "string", allowableValues = {"SCHEDULED", "ONGOING", "ENDED"}, defaultValue = "ONGOING"))
        @RequestParam(defaultValue = "ONGOING") AttendanceStatus status
    ) {
        return service.listMine(user.getId(), status);
    }

    @PostMapping("/{attendanceId}/check-in")
    @Operation(operationId = "checkInAttendance", summary = "QR 스캔으로 본인 출석 등록", description = """
        스캔한 QR의 attendanceId를 경로에, qrToken을 요청 본문에 넣습니다.
        서버는 JWT의 사용자 ID로 본인의 출석만 처리하며 타인의 userId는 받지 않습니다.
        출석체크가 ONGOING이고 본인이 대상자이며, 해당 출석체크의 최신 QR 토큰이 유효해야 합니다.
        최초 성공 시 PRESENT로 변경하고 서버의 현재 시각을 checkedInAt에 기록합니다.
        유효한 QR로 이미 출석한 사용자가 다시 요청하면 200과 기존 출석 시각을 반환합니다.
        동시 요청에도 (attendanceId, userId)별 출석은 한 번만 기록하며 집계가 중복 증가하지 않습니다.
        QR 출석은 관리자가 입력한 비고를 변경하지 않습니다.
        """)
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "본인 출석 완료 또는 이미 출석한 사용자의 기존 결과",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = CheckIn.class))),
        @ApiResponse(responseCode = "400", description = "잘못된 입력 또는 위조·만료·재발급으로 무효화된 QR, 다른 출석체크의 토큰 (COMMON_INVALID_INPUT)",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "403", description = "해당 출석체크의 대상자가 아님 (AUTH_FORBIDDEN)",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "404", description = "출석체크를 찾을 수 없음 (COMMON_RESOURCE_NOT_FOUND)",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "409", description = "예정되었거나 종료되어 출석을 진행할 수 없음 (COMMON_CONFLICT)",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public CheckIn checkIn(
        @Parameter(description = "출석체크 ID", example = "1", schema = @Schema(minimum = "1")) @PathVariable @Positive long attendanceId,
        @Parameter(hidden = true) @CurrentUser UserPrincipal user,
        @Valid @RequestBody AttendanceRequests.CheckIn request
    ) {
        return service.checkIn(attendanceId, user.getId(), request.qrToken());
    }
}
