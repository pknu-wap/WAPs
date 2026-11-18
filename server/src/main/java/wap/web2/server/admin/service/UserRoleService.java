package wap.web2.server.admin.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.admin.dto.request.RoleChangeRequest;
import wap.web2.server.admin.dto.response.RoleChangeResponse;
import wap.web2.server.admin.dto.response.UserRolePageResponse;
import wap.web2.server.admin.dto.response.UserRoleResponse;
import wap.web2.server.member.entity.Role;
import wap.web2.server.member.entity.MemberType;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.admin.dto.request.MemberTypeChangeRequest;
import wap.web2.server.admin.dto.request.UserAttributesChangeRequest;
import wap.web2.server.exception.BadRequestException;

@Service
@RequiredArgsConstructor
public class UserRoleService {

    private final UserRepository userRepository;

    @Transactional
    public List<UserRoleResponse> changeAttributes(UserAttributesChangeRequest request) {
        if (!request.isChangeProvided() || !request.isRoleAllowed()) {
            throw new BadRequestException("변경할 권한 또는 LEVEL을 올바르게 선택해주세요.");
        }
        if (request.userIds() == null || request.userIds().isEmpty() ||
            request.userIds().stream().anyMatch(id -> id == null || id <= 0)) {
            throw new BadRequestException("변경할 사용자를 선택해주세요.");
        }
        List<Long> ids = request.userIds().stream().distinct().toList();
        List<User> users = userRepository.findAllById(ids);
        if (users.size() != ids.size()) {
            throw new BadRequestException("존재하지 않는 사용자가 포함되어 있습니다.");
        }
        // Validate the whole selection before modifying any user. Both attributes
        // are saved in the same transaction, including a single-field change.
        users.forEach(user -> {
            if (request.role() != null) user.setRole(request.role());
            if (request.memberType() != null) user.setMemberType(request.memberType());
        });
        return users.stream().map(UserRoleResponse::from).toList();
    }

    @Transactional
    public List<UserRoleResponse> changeMemberType(MemberTypeChangeRequest request) {
        List<Long> ids = request.userIds().stream().distinct().toList();
        List<User> users = userRepository.findAllById(ids);
        if (users.size() != ids.size()) {
            throw new BadRequestException("존재하지 않는 사용자가 포함되어 있습니다.");
        }
        users.forEach(user -> user.setMemberType(request.memberType()));
        return users.stream().map(UserRoleResponse::from).toList();
    }

    @Transactional
    public RoleChangeResponse change(RoleChangeRequest roleChangeRequest) {
        List<Long> userIds = roleChangeRequest.getUserIds();
        Role newRole = roleChangeRequest.getNewRole();

        if (userIds.isEmpty()) {
            return new RoleChangeResponse(0, newRole);
        }

        int updated = userRepository.updateRoleByIds(newRole, userIds);
        return new RoleChangeResponse(updated, newRole);
    }

    @Transactional(readOnly = true)
    public UserRolePageResponse getUsersForAdmin(int size, int page, Role role) {
        return getUsersForAdmin(size, page, role, null);
    }

    @Transactional(readOnly = true)
    public UserRolePageResponse getUsersForAdmin(int size, int page, Role role, MemberType memberType) {
        int fetchSize = size + 1; // 다음 페이지 유무를 확인하기 위해 size보다 크게 가져옴
        int offset = page * size;

        List<User> users = memberType == null
            ? userRepository.findUserByOffset(fetchSize, offset, role)
            : userRepository.findUserByOffsetAndMemberType(fetchSize, offset, role, memberType);

        boolean hasNext = false;
        List<UserRoleResponse> content = users.stream().map(UserRoleResponse::from).toList();

        if (users.size() > size) {
            hasNext = true;
            content = content.subList(0, size);
        }

        return new UserRolePageResponse(content, hasNext);
    }
}
