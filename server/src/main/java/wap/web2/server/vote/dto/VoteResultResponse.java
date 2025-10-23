package wap.web2.server.vote.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import wap.web2.server.project.entity.Project;
import wap.web2.server.vote.entity.VoteResult;

@Getter
@Builder
@AllArgsConstructor
public class VoteResultResponse {

    private String projectName;
    private String projectSummary;
    private String thumbnail;
    private long voteCount;
    private double voteRate;

    @Deprecated
    public static VoteResultResponse from(Project project) {
        return VoteResultResponse.builder()
                .projectName(project.getTitle())
                .projectSummary(project.getSummary())
                .thumbnail(project.getThumbnail())
                .voteCount(project.getVoteCount())
                .build();
    }

    public static VoteResultResponse from(VoteResult result) {
        return VoteResultResponse.builder()
                .projectName(result.getProject().getTitle())
                .projectSummary(result.getProject().getSummary())
                .thumbnail(result.getProject().getThumbnail())
                .voteCount(result.getVoteCount())
                .build();
    }

    public void calculateVoteRate(long totalVoted) {
        if (totalVoted == 0) {
            voteRate = 0.0;
            return;
        }
        double rate = (double) voteCount / totalVoted * 100;
        voteRate = Math.round(rate * 10) / 10.0;
    }

}
