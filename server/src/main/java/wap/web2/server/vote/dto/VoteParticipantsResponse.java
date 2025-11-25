package wap.web2.server.vote.dto;

import lombok.Builder;

@Builder
public record VoteParticipantsResponse(
        long participants,
        String title,
        String projectType,
        String summary,
        String thumbnail
) {

    public static VoteParticipantsResponse from(VoteParticipants voteParticipants) {
        return VoteParticipantsResponse.builder()
                .participants(voteParticipants.getParticipants())
                .title(voteParticipants.getTitle())
                .projectType(voteParticipants.getProjectType())
                .summary(voteParticipants.getSummary())
                .thumbnail(voteParticipants.getThumbnail())
                .build();
    }

}
