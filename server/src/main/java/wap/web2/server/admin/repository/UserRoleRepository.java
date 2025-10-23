package wap.web2.server.admin.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.User;

public interface UserRoleRepository extends JpaRepository<User, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE User u SET u.role = :role WHERE u.id in :ids
            """)
    int updateRoleByIds(@Param("role") Role role, @Param("ids") List<Long> ids);

    @Query("SELECT u FROM User u ORDER BY u.id LIMIT :limit OFFSET :offset")
    List<User> findUserByOffset(@Param("limit") Integer limit, @Param("offset") Integer offset);
}
