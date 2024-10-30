package wap.web2.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wap.web2.server.domain.Project;
import wap.web2.server.domain.User;

public interface ProjectRepository extends JpaRepository<Project, Long> {
}
