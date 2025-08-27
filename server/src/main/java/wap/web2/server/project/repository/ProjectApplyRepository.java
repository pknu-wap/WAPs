package wap.web2.server.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import wap.web2.server.project.entity.ProjectApply;

@Repository
public interface ProjectApplyRepository extends JpaRepository<ProjectApply, Long> {

}
