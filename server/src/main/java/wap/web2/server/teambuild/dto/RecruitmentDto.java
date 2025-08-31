package wap.web2.server.teambuild.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RecruitmentDto {

    @NotNull
    private Long projectId;

    @NotEmpty
    private List<@Valid RecruitmentInfo> roasters;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static final class RecruitmentInfo {
        @Min(1)
        private Integer capacity;

        @NotBlank
        private String position;

        @NotEmpty
        private List<Long> applicantIds;
    }

}
