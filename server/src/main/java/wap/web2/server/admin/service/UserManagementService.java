package wap.web2.server.admin.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.admin.dto.request.UserAttributesRequest;
import wap.web2.server.admin.dto.response.UserRoleResponse;
import wap.web2.server.exception.BadRequestException;
import wap.web2.server.exception.ConflictException;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.member.entity.MembershipLevel;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class UserManagementService {
    private final UserRepository users;
    private final JdbcTemplate jdbc;

    public static MembershipLevel level(String value) {
        if (value == null) return null;
        try {
            return MembershipLevel.valueOf(value.equals("UNDECIDED") ? "NONE" : value);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("유효하지 않은 LEVEL입니다.");
        }
    }

    private List<User> lockUsers(List<Long> ids) {
        if (ids.stream().distinct().count() != ids.size())
            throw new BadRequestException("사용자 ID가 중복되었습니다.");
        // Lock in a stable order and resolve every target before changing anything.
        return ids.stream().sorted().map(id -> users.findByIdForUpdate(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id))).toList();
    }

    @Transactional
    public List<UserRoleResponse> update(UserAttributesRequest request) {
        var level = level(request.memberType());
        var targets = lockUsers(request.userIds());
        for (var user : targets) {
            if (request.role() != null) user.setRole(request.role());
            if (level != null) user.setMembershipLevel(level);
        }
        users.flush();
        return targets.stream().map(UserRoleResponse::from).toList();
    }

    @Transactional
    public void delete(List<Long> ids) {
        var targets = lockUsers(ids);
        try {
            for (var user : targets) {
                jdbc.update("DELETE FROM refresh_token WHERE user_id = ?", user.getId());
                // Bulk SQL deliberately bypasses User's cascading project/comment removal.
                // Remaining foreign keys reject deletion of accounts with shared content.
                jdbc.update("DELETE FROM `user` WHERE user_id = ?", user.getId());
            }
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("연결된 프로젝트·댓글·지원 내역 또는 개발 로그인 계정이 있어 삭제할 수 없습니다. 연결 정보를 먼저 정리해 주세요.");
        }
    }
}
