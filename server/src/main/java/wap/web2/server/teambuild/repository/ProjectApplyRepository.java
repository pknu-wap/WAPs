package wap.web2.server.teambuild.repository;

import java.util.List;
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
}
