package wap.web2.server.vote.dto;

import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class VoteRequest {

    @Size(min = 3, max = 3, message = "투표 수는 1~3개입니다.")
    private List<Long> projectIds;
}
