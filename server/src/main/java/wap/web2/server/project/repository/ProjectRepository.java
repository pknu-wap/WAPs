package wap.web2.server.project.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wap.web2.server.project.entity.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query(value = "select p from Project p where p.projectYear = :year and p.semester = :semester")
    List<Project> findProjectsByYearAndSemester(@Param("year") Long year, @Param("semester") Long semester);

    @Query("SELECT b FROM Project b WHERE b.projectId = :projectId AND b.user.id = :userId")
    Project findByProjectIdAndUser(@Param("projectId") Long projectId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Project p SET p.voteCount = p.voteCount + 1 WHERE p.projectId = :projectId")
    int voteByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT p FROM Project p WHERE p.projectYear = :year AND p.semester = :semester ORDER BY p.projectId DESC")
    List<Project> findProjectsByYearAndSemesterOrderByProjectIdDesc(@Param("year") Long year,
                                                                    @Param("semester") Long semester);
}
