package wap.web2.server.attendance.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;

@Schema(description = "예정 / 진행 중 / 종료. 한국 시간(Asia/Seoul)의 현재 날짜가 출석 날짜 이전이면 SCHEDULED, 같으면 ONGOING, 이후이면 ENDED입니다.",
    example = "ONGOING")
public enum AttendanceStatus {
    SCHEDULED, ONGOING, ENDED;

    public static AttendanceStatus on(LocalDate date, LocalDate today) {
        if (date.isAfter(today)) return SCHEDULED;
        if (date.isBefore(today)) return ENDED;
        return ONGOING;
    }
}
