package wap.web2.server.admin.dto.request;

import java.util.Set;

public record VoteParticipants(Set<Long> projectIds) {
}
