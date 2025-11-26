package wap.web2.server.vote.dto;

import java.util.List;

public record VoteResultsResponse(
        String semester,
        List<VoteResultResponse> results
) {

    public static VoteResultsResponse of(String semester, List<VoteResultResponse> results) {
        return new VoteResultsResponse(semester, results);
    }
}
