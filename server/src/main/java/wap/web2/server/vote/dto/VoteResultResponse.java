package wap.web2.server.vote.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class VoteResultResponse {

    private String projectName;
    private String projectSummary;
    private String thumbnail;
    private long voteCount;
    private double voteRate;

}
