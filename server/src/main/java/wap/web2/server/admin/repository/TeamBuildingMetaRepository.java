package wap.web2.server.admin.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wap.web2.server.admin.entity.TeamBuildingMeta;

public interface TeamBuildingMetaRepository extends JpaRepository<TeamBuildingMeta, Long> {

    @Modifying
    @Query("UPDATE TeamBuildingMeta t SET t.canApply = :canApply WHERE t.semester = :semester")
    int updateApplyStatus(@Param("semester") String semester, @Param("canApply") Boolean canApply);

    @Modifying
    @Query("UPDATE TeamBuildingMeta t SET t.canRecruit = :canRecruit WHERE t.semester = :semester")
    int updateRecruitStatus(@Param("semester") String semester, @Param("canRecruit") Boolean canRecruit);

    @Modifying
    @Query("UPDATE TeamBuildingMeta t SET t.isOpen = :isOpen WHERE t.semester = :semester")
    int updateTeamBuildingStatus(@Param("semester") String semester, @Param("isOpen") Boolean isOpen);

    Optional<TeamBuildingMeta> findBySemester(String semester);

    boolean existsTeamBuildingMetaBySemester(String semester);
}
