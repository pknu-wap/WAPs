package wap.web2.server.teambuild.repository;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import wap.web2.server.teambuild.entity.Team;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    List<Team> findAllBySemester(String semester);

    @Query("SELECT t.projectId AS projectId, COUNT(t) AS memberCount "
            + "FROM Team t "
            + "WHERE t.semester = :semester AND t.projectId IS NOT NULL "
            + "GROUP BY t.projectId")
    List<TeamMemberCount> countMembersByProject(@Param("semester") String semester);

    interface TeamMemberCount {
        Long getProjectId();

        Long getMemberCount();
    }
}
