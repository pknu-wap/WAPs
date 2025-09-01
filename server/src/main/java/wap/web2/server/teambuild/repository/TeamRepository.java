package wap.web2.server.teambuild.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import wap.web2.server.teambuild.entity.Team;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

}
