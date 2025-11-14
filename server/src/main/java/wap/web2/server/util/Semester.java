package wap.web2.server.util;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.Pattern;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 적용 대상은 필드나 파라미터이고, 학기 형식을 따르기 위해 사용합니다. 2025-01, 2025-02가 가능합니다.
 */
@Documented
@Constraint(validatedBy = {})
@Pattern(regexp = "^(19|20)\\d{2}-(01|02)$", message = "semester 형식은 yyyy-01 또는 yyyy-02여야 합니다.")
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.TYPE_USE})
@Retention(RetentionPolicy.RUNTIME)
public @interface Semester {
    String message() default "semester 형식은 yyyy-01 또는 yyyy-02여야 합니다.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
