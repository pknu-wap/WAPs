package wap.web2.server.admin.dto.response;

import lombok.Builder;

@Builder
public record AdminVoteResultResponse(
        long projctId,
        String projectName,
        long voteCount,
        double voteRate
) {
}
