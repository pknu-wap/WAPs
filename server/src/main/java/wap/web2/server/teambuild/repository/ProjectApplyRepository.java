package wap.web2.server.teambuild.repository;

import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import wap.web2.server.project.entity.Project;
import wap.web2.server.teambuild.dto.TeamMemberResult;
import wap.web2.server.teambuild.entity.Position;
import wap.web2.server.teambuild.entity.ProjectApply;

@Repository
public interface ProjectApplyRepository extends JpaRepository<ProjectApply, Long> {

    List<ProjectApply> findAllByProject(Project project);

    List<ProjectApply> findAllBySemesterAndPosition(String semester, Position position);

    @Query("select DISTINCT new wap.web2.server.teambuild.dto.TeamMemberResult(p.user.id, p.user.name, p.position) from ProjectApply p where p.user.id in :userIds")
    List<TeamMemberResult> findAllByUserId(@Param("userIds") List<Long> userIds);


    @Query("""
            select pa from ProjectApply pa
            join fetch pa.user
            where pa.project.projectId = :projectId
              and pa.semester = :semester
              and pa.user.id in :userIds
            order by pa.priority asc
            """)
    List<ProjectApply> findByProjectIdAndSemesterAndUserIdsWithUserOrderByPriorityAsc(
            @Param("projectId") Long projectId,
            @Param("semester") String semester,
            @Param("userIds") Collection<Long> userIds
    );

    boolean existsByUserIdAndSemester(Long userId, String semester);

    Page<ProjectApply> findAllBySemester(String semester, Pageable pageable);

    List<ProjectApply> findAllBySemester(String semester);

    @Query("""
            select pa from ProjectApply pa
            join fetch pa.user
            where pa.semester = :semester
            """)
    List<ProjectApply> findAllBySemesterWithUser(@Param("semester") String semester);

}
