package wap.web2.server.vote.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import wap.web2.server.util.Semester;

public record VoteRequest2(
        @NotNull
        @Size(min = 3, max = 3, message = "3개의 프로젝트에 투표해야합니다.")
        List<Long> projectIds,

        @NotNull
        @Semester
        String semester
) {
}
