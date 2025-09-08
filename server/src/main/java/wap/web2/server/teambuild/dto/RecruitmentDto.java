package wap.web2.server.teambuild.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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

    private List<@Valid RecruitmentInfo> roasters;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static final class RecruitmentInfo {
        private Integer capacity;

        @NotBlank
        private String position;

        private List<Long> applicantIds;
    }

}
