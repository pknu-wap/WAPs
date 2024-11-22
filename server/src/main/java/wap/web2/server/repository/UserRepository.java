package wap.web2.server.repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wap.web2.server.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    //업데이트 된 레코드 수를 반환
    @Modifying
    @Query("UPDATE User u SET u.voted = true WHERE u.id = :userId")
    int updateVotedTrueByUserId(@Param("userId") Long userId);
}
