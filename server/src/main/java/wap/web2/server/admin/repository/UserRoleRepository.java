package wap.web2.server.admin.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wap.web2.server.member.entity.User;

public interface UserRoleRepository extends JpaRepository<User, Long> {


}
