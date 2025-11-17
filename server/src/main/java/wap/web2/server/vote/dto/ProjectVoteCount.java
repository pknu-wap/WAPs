package wap.web2.server.vote.dto;

public record ProjectVoteCount(
        Long projectId,  // 프로젝트 ID
        Long voteCount   // 해당 프로젝트 득표 수
) {

}
