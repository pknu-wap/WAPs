package wap.web2.server.vote.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import wap.web2.server.admin.entity.VoteStatus;
import wap.web2.server.vote.dto.ProjectVoteCount;
import wap.web2.server.vote.entity.Ballot;

@Repository
public interface BallotRepository extends JpaRepository<Ballot, Long> {

    long countBallotsBySemesterAndUserId(String semester, Long userId);

    @Query("""
            SELECT p.projectId as projectId,
                   COUNT(b) as voteCount,
                   p.title as projectName,
                   p.summary as projectSummary,
                   p.thumbnail as thumbnail
            FROM VoteMeta vm
            JOIN vm.participants participantId
            JOIN Project p ON p.projectId = participantId
            LEFT JOIN Ballot b ON b.projectId = p.projectId AND b.semester = vm.semester
            WHERE vm.semester = :semester
            GROUP BY p.projectId
            """)
    List<ProjectVoteCount> countVotesByProject(@Param("semester") String semester);

    @Query("""
                SELECT b.projectId
                FROM Ballot b
                WHERE b.userId = :userId
                  AND b.semester = :semester
            """)
    List<Long> findProjectIdsByUserIdAndSemester(@Param("userId") Long userId, @Param("semester") String semester);

    @Query("""
            SELECT MAX(v.semester)
            FROM VoteMeta v
            WHERE v.semester <= :currentSemester and v.status = :ended and v.isResultPublic = true
            """)
    String findPublicLatestSemester(@Param("currentSemester") String currentSemester, @Param("ended") VoteStatus ended);

    @Query("""
            SELECT p.projectId as projectId,
                   COUNT(b) as voteCount,
                   p.title as projectName,
                   p.summary as projectSummary,
                   p.thumbnail as thumbnail
            FROM VoteMeta vm
            JOIN vm.participants participantId
            JOIN Project p ON p.projectId = participantId
            LEFT JOIN Ballot b ON b.projectId = p.projectId AND b.semester = vm.semester
            WHERE vm.semester = :latestSemester
            GROUP BY p.projectId, p.title, p.summary, p.thumbnail
            """)
    List<ProjectVoteCount> findPublicLatestBallots(@Param("latestSemester") String latestSemester);
}
