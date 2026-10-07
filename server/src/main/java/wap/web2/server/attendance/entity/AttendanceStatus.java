package wap.web2.server.attendance.entity;

import java.time.LocalDate;

public enum AttendanceStatus {
    SCHEDULED, ONGOING, ENDED;

    public static AttendanceStatus on(LocalDate date, LocalDate today) {
        if (date.isAfter(today)) return SCHEDULED;
        if (date.isBefore(today)) return ENDED;
        return ONGOING;
    }
}
