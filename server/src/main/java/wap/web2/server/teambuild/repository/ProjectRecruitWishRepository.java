package wap.web2.server.teambuild.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import wap.web2.server.teambuild.entity.ProjectRecruitWish;

@Repository
public interface ProjectRecruitWishRepository extends JpaRepository<ProjectRecruitWish, Long> {

}
