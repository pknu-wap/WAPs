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

    // 지원자가 한 명도 없는 경우를 고려해 empty list를 받을 수 있도록 한다.
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
