package wap.web2.server.util;

import java.time.YearMonth;

public class SemesterGenerator {

    public static final int SECOND_SEMESTER_MONTH = 6;
    public static final String FIRST_SEMESTER = "-01";
    public static final String SECOND_SEMESTER = "-02";

    public static String generateSemester() {
        YearMonth now = YearMonth.now();
        return now.getMonthValue() <= SECOND_SEMESTER_MONTH
                ? now.getYear() + FIRST_SEMESTER
                : now.getYear() + SECOND_SEMESTER;

    }

}
