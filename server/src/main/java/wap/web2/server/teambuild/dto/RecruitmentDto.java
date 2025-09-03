package wap.web2.server.teambuild.dto;

import jakarta.validation.Valid;
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
        private Integer capacity;

        @NotBlank
        private String position;

        private List<Long> applicantIds; // 일단 임시로 지워놨음
        // 열어놓지 않은 포지션에 신청하는 사람이 있을수도 or 그렇게 처리하는게 편할수도

    }

}
