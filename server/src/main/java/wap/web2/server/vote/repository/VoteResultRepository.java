package wap.web2.server.vote.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wap.web2.server.vote.entity.VoteResult;

public interface VoteResultRepository extends JpaRepository<VoteResult, Long> {

    @Modifying(clearAutomatically = true)
    @Query("UPDATE VoteResult vr SET vr.voteCount = vr.voteCount + 1 " +
            "WHERE vr.vote.id = :voteId AND vr.project.projectId = :projectId")
    int incrementVoteCount(@Param("voteId") Long voteId, @Param("projectId") Long projectId);

}
