package wap.web2.server.project.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectAppliesRequest {

    @NotNull
    @Size(min = 1, max = 5, message = "지원은 1개 이상 5개 이하만 가능합니다.")
    private List<@Valid ApplyRequest> applies;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplyRequest {
        @NotNull
        private Long projectId;

        @NotBlank
        @Size(max = 32)
        private String position;

        @NotBlank
        @Size(max = 255)
        private String comment;
    }

}
