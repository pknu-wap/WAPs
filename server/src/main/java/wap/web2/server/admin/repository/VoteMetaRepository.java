package wap.web2.server.admin.repository;

import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import wap.web2.server.admin.entity.VoteMeta;
import wap.web2.server.admin.entity.VoteStatus;

@Repository
public interface VoteMetaRepository extends JpaRepository<VoteMeta, Long> {

    @Query("SELECT v.status FROM VoteMeta v WHERE v.semester = :semester")
    Optional<VoteStatus> findStatusBySemester(@Param("semester") String semester);

    boolean existsBySemester(String semester);

    Optional<VoteMeta> findBySemester(String semester);

    @Query(
            value = "SELECT participants FROM vote_meta_participants WHERE vote_meta_id = :voteMetaId",
            nativeQuery = true
    )
    Set<Long> findParticipantsByVoteMetaId(@Param("voteMetaId") Long voteMetaId);

}
