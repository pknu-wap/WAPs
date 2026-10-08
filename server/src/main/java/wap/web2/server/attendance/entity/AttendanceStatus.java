package wap.web2.server.attendance.entity;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "예정 / 진행 중 / 종료. 생성 시 항상 SCHEDULED이며, 관리자가 변경할 때까지 날짜와 무관하게 유지됩니다.",
    example = "ONGOING")
public enum AttendanceStatus {
    SCHEDULED, ONGOING, ENDED
}
