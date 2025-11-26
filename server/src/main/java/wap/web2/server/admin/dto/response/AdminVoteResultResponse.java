package wap.web2.server.admin.dto.response;

import lombok.Builder;
import wap.web2.server.vote.dto.ProjectVoteCount;

@Builder
public record AdminVoteResultResponse(
        long projectId,
        String projectName,
        long voteCount,
        double voteRate
) {

    public static AdminVoteResultResponse of(ProjectVoteCount projectVoteCount, long totalVotes) {
        double rate = (totalVotes == 0) ? 0 : (projectVoteCount.getVoteCount() * 100.0) / totalVotes;
        double roundedRate = Math.round(rate * 10) / 10.0;

        return AdminVoteResultResponse.builder()
                .projectId(projectVoteCount.getProjectId())
                .projectName(projectVoteCount.getProjectName())
                .voteCount(projectVoteCount.getVoteCount())
                .voteRate(roundedRate)
                .build();
    }
}
