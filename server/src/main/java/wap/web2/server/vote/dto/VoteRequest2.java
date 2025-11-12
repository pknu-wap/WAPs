package wap.web2.server.vote.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record VoteRequest2(
        @Size(min = 3, max = 3, message = "3개의 프로젝트에 투표해야합니다.")
        List<Long> projectIds,

        @NotNull
        String semester
) {
}
