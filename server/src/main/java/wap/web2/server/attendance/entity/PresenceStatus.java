package wap.web2.server.attendance.entity;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "출석 / 미출석. 지각은 별도 상태로 구분하지 않고 PRESENT로 간주합니다.", example = "ABSENT")
public enum PresenceStatus {
    PRESENT, ABSENT
}
