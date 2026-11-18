package wap.web2.server.admin.service;

import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.exception.BadRequestException;

@Service
@RequiredArgsConstructor
public class UserDeletionService {
    private final NamedParameterJdbcTemplate jdbc;

    @Transactional
    public void deleteUsers(List<Long> requestedIds, Long actorId) {
        if (requestedIds == null || requestedIds.isEmpty() || requestedIds.size() > 1000 ||
            requestedIds.stream().anyMatch(id -> id == null || id <= 0)) {
            throw new BadRequestException("삭제할 사용자를 올바르게 선택해주세요.");
        }
        List<Long> ids = requestedIds.stream().distinct().toList();
        if (ids.contains(actorId)) {
            throw new BadRequestException("현재 로그인한 관리자 계정은 삭제할 수 없습니다.");
        }
        Map<String, Object> params = Map.of("ids", ids);
        List<Long> existing = jdbc.queryForList(
            "SELECT user_id FROM user WHERE user_id IN (:ids) ORDER BY user_id FOR UPDATE", params, Long.class);
        if (existing.size() != ids.size()) {
            throw new BadRequestException("존재하지 않는 사용자가 포함되어 있습니다.");
        }
        Integer projects = jdbc.queryForObject(
            "SELECT COUNT(*) FROM project WHERE user_id IN (:ids)", params, Integer.class);
        if (projects != null && projects > 0) {
            throw new BadRequestException("프로젝트 소유 계정이 포함되어 있습니다. 프로젝트 소유권을 먼저 정리해주세요.");
        }
        // Keep shared projects intact; remove only the selected accounts' records.
        jdbc.update("DELETE FROM project_recruit_wish WHERE applicant_id IN (:ids) OR project_recruit_id IN (SELECT id FROM project_recruit WHERE leader_id IN (:ids))", params);
        jdbc.update("DELETE FROM project_recruit WHERE leader_id IN (:ids)", params);
        for (String table : List.of("refresh_token", "project_apply", "comment", "user_voted_project_ids",
            "ballot", "attendance_participant", "field_cluster_member", "third_round_position_slot")) {
            jdbc.update("DELETE FROM " + table + " WHERE user_id IN (:ids)", params);
        }
        jdbc.update("DELETE FROM team WHERE member_id IN (:ids) OR leader_id IN (:ids)", params);
        jdbc.update("UPDATE dev_login_slot SET user_id = NULL, session_id = NULL, token_id = NULL, expires_at = NULL WHERE user_id IN (:ids)", params);
        jdbc.update("DELETE FROM user WHERE user_id IN (:ids)", params);
    }
}
