package wap.web2.server.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import wap.web2.server.project.entity.ProjectRecruit;

@Repository
public interface ProjectRecruitRepository extends JpaRepository<ProjectRecruit, Long> {

}
