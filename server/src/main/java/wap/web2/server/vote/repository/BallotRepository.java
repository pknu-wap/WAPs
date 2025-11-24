package wap.web2.server.vote.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import wap.web2.server.admin.entity.VoteStatus;
import wap.web2.server.vote.dto.VoteCount;
import wap.web2.server.vote.entity.Ballot;

@Repository
public interface BallotRepository extends JpaRepository<Ballot, Long> {

    long countBallotsBySemesterAndUserId(String semester, Long userId);

    @Query("""
                SELECT b.projectId as projectId, COUNT(b) as voteCount
                FROM Ballot b
                WHERE b.semester = :semester
                GROUP BY b.projectId
            """)
    List<VoteCount> countVotesByProject(@Param("semester") String semester);

    @Query("""
                SELECT b.projectId
                FROM Ballot b
                WHERE b.userId = :userId
                  AND b.semester = :semester
            """)
    List<Long> findProjectIdsByUserIdAndSemester(@Param("userId") Long userId, @Param("semester") String semester);

    @Query("""
            SELECT b.projectId as projectId, COUNT(b) as voteCount
            FROM Ballot b
            WHERE b.semester = (
                SELECT MAX(v.semester)
                FROM VoteMeta v
                WHERE v.semester <= :currentSemester and v.status = :ended and v.isResultPublic = true
            )
            GROUP BY b.projectId
            """)
    List<VoteCount> findPublicLatestBallots(@Param("currentSemester") String currentSemester,
                                            @Param("ended") VoteStatus ended);
}
