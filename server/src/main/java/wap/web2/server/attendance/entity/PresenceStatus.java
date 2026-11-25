package wap.web2.server.attendance.entity;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "출석(PRESENT), 지각(LATE), 미출석(ABSENT). 지각은 관리자가 직접 지정합니다.", example = "ABSENT")
public enum PresenceStatus {
    PRESENT, LATE, ABSENT
}
