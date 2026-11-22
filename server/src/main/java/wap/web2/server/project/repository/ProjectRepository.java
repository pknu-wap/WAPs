package wap.web2.server.project.repository;

import java.util.List;
import java.util.Set;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wap.web2.server.project.entity.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findProjectsBySemester(String semester);

    List<Project> findAllByUser_IdAndSemesterOrderByProjectIdDesc(Long userId, String semester);

    List<Project> findProjectsBySemesterOrderByProjectIdDesc(String semester);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p.projectId FROM Project p WHERE p.projectId IN :projectIds AND p.semester = :semester ORDER BY p.projectId")
    List<Long> findExistingProjectIds(@Param("projectIds") Set<Long> projectIds, @Param("semester") String semester);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Project p WHERE p.projectId = :projectId")
    Optional<Project> findByIdForUpdate(@Param("projectId") Long projectId);

    @Query("SELECT COUNT(v) > 0 FROM VoteMeta v JOIN v.participants participantId WHERE participantId = :projectId")
    boolean participatesInVote(@Param("projectId") Long projectId);
}
