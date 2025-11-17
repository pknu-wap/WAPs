package wap.web2.server.vote.dto;

import lombok.Builder;

@Builder
public record VoteResultResponse(
        String projectName,
        String projectSummary,
        String thumbnail,
        long voteCount,
        double voteRate
) {

}
