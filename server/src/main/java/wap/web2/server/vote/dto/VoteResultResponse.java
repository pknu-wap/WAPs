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

    public static VoteResultResponse of(ProjectVoteCount projectVoteCount, long totalVotes) {
        double rate = (totalVotes == 0) ? 0 : (projectVoteCount.getVoteCount() * 100.0) / totalVotes;
        double roundedRate = Math.round(rate * 10) / 10.0;

        return VoteResultResponse.builder()
                .projectName(projectVoteCount.getProjectName())
                .projectSummary(projectVoteCount.getProjectSummary())
                .thumbnail(projectVoteCount.getThumbnail())
                .voteCount(projectVoteCount.getVoteCount())
                .voteRate(roundedRate)
                .build();
    }
}
