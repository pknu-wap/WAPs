package wap.web2.server.member.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import wap.web2.server.member.entity.User;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    //업데이트 된 레코드 수를 반환
    @Modifying
    @Query("UPDATE User u SET u.voted = true WHERE u.id = :userId")
    int updateVotedTrueByUserId(@Param("userId") Long userId);

}
