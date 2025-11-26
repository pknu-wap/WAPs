package wap.web2.server.admin.repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import wap.web2.server.admin.entity.VoteMeta;
import wap.web2.server.admin.entity.VoteStatus;
import wap.web2.server.vote.dto.VoteParticipants;

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

    @Query(value = """
            SELECT 
                vmp.participants AS participants,
                p.title AS title,
                p.project_type AS projectType,
                p.summary AS summary,
                p.thumbnail AS thumbnail
            FROM vote_meta_participants vmp
            JOIN project p ON p.project_id = vmp.participants
            WHERE vmp.vote_meta_id = (
                SELECT vm.id FROM vote_meta vm WHERE vm.semester = :semester
            )
            """, nativeQuery = true)
    List<VoteParticipants> findParticipantsProjectBySemester(@Param("semester") String semester);

    @Query("SELECT v.isResultPublic FROM VoteMeta v WHERE v.semester = :semester")
    boolean isResultPublic(@Param("semester") String semester);

    @Modifying
    @Query("UPDATE VoteMeta v SET v.isResultPublic = :isPublic where v.semester = :semester")
    void updateResultVisibility(@Param("isPublic") boolean isPublic, @Param("semester") String semester);

}
