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
public class ProjectApplyRequest {

    @NotNull
    @Size(min = 1, max = 5)
    private List<@Valid Apply> applies;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Apply {
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
