package wap.web2.server.member.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserVoteResponse {

    private List<Long> projectIds;

}
