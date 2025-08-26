package wap.web2.server.vote.dto;

import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoteRequest {

    @Size(min = 3, max = 3, message = "3개의 프로젝트에 투표해야합니다.")
    private List<Long> projectIds;

}
