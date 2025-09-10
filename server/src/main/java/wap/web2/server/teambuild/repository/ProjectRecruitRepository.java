package wap.web2.server.teambuild.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import wap.web2.server.teambuild.entity.Position;
import wap.web2.server.teambuild.entity.ProjectRecruit;

@Repository
public interface ProjectRecruitRepository extends JpaRepository<ProjectRecruit, Long> {

    ProjectRecruit findProjectRecruitByProject_ProjectId(Long projectId);

    List<ProjectRecruit> findAllBySemesterAndPosition(String semester, Position position);

}
