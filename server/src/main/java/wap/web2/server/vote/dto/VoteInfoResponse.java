package wap.web2.server.vote.dto;

import lombok.Builder;

@Builder
public record VoteInfoResponse(
        boolean isOpen,
        boolean isVotedUser
) {

}
