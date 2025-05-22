package wap.web2.server.vote.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class VoteInfoResponse {

    private boolean isOpen;
    private boolean isVotedUser;

}
