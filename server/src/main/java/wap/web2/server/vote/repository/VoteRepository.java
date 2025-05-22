package wap.web2.server.vote.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import wap.web2.server.vote.entity.Vote;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {

    @Query(value = "select v from Vote v where v.year = :year and v.semester = :semester")
    Optional<Vote> findVoteByYearAndSemester(@Param("year") Integer year, @Param("semester") Integer semester);

}
