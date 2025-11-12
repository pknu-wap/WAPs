package wap.web2.server.admin.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import wap.web2.server.admin.entity.VoteMeta;
import wap.web2.server.admin.entity.VoteStatus;

@Repository
public interface VoteMetaRepository extends JpaRepository<VoteMeta, Long> {

    @Query("SELECT v.status FROM VoteMeta v WHERE v.semester = :semester")
    VoteStatus findStatusBySemester(@Param("semester") String semester);

    boolean existsBySemester(String semester);

    @Modifying
    @Query("UPDATE VoteMeta v SET v.status = 'OPEN' WHERE v.semester = :semester")
    void updateToOpen(@Param("semester") String semester);

    @Modifying
    @Query("UPDATE VoteMeta v SET v.status = 'CLOSED' WHERE v.semester = :semester")
    void updateToClosed(@Param("semester") String semester);
}
