package wap.web2.server.teambuild.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import wap.web2.server.project.entity.Project;
import wap.web2.server.teambuild.entity.Position;
import wap.web2.server.teambuild.entity.ProjectApply;

@Repository
public interface ProjectApplyRepository extends JpaRepository<ProjectApply, Long> {

    List<ProjectApply> findAllByProject(Project project);

    List<ProjectApply> findAllBySemesterAndPosition(String semester, Position position);

}
