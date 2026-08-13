package wap.web2.server.teambuild.dto.request;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import wap.web2.server.teambuild.dto.request.ProjectAppliesRequest.ApplyRequest;

class ProjectAppliesRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    private ProjectAppliesRequest requestWith(int count) {
        List<ApplyRequest> applies = new ArrayList<>();
        for (long projectId = 1; projectId <= count; projectId++) {
            applies.add(new ApplyRequest(projectId, "BACKEND", "열심히할게요."));
        }
        return new ProjectAppliesRequest(applies);
    }

    @Test
    void 지원_목록이_1개면_유효하다() {
        ProjectAppliesRequest request = requestWith(1);

        Set<ConstraintViolation<ProjectAppliesRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }

    @Test
    void 같은_프로젝트의_다른_직무_지원을_포함해_총_5개까지_유효하다() {
        ProjectAppliesRequest request = new ProjectAppliesRequest(
                List.of(
                        new ApplyRequest(1L, "FRONTEND", "열심히할게요."),
                        new ApplyRequest(1L, "BACKEND", "열심히할게요."),
                        new ApplyRequest(2L, "AI", "열심히할게요."),
                        new ApplyRequest(3L, "DESIGN", "열심히할게요."),
                        new ApplyRequest(4L, "APP", "열심히할게요.")
                )
        );

        Set<ConstraintViolation<ProjectAppliesRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }

    @Test
    void 지원_목록이_6개면_검증에_실패한다() {
        ProjectAppliesRequest request = requestWith(6);

        Set<ConstraintViolation<ProjectAppliesRequest>> violations = validator.validate(request);

        assertThat(violations).isNotEmpty();
        assertThat(violations)
                .anyMatch(violation -> violation.getMessage().contains("지원은 1개 이상 5개 이하만 가능합니다."));
    }

    @Test
    void 지원_목록이_비어있으면_검증에_실패한다() {
        ProjectAppliesRequest request = new ProjectAppliesRequest(List.of());

        Set<ConstraintViolation<ProjectAppliesRequest>> violations = validator.validate(request);

        assertThat(violations).isNotEmpty();
    }

}
