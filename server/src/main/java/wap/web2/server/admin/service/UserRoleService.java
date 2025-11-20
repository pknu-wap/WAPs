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
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class UserRoleService {

    private final UserRepository userRepository;

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
    public UserRolePageResponse getUsersForAdmin(int size, int page) {
        int fetchSize = size + 1; // 다음 페이지 유무를 확인하기 위해 size보다 크게 가져옴
        int offset = page * size;
        List<User> users = userRepository.findUserByOffset(fetchSize, offset);

        boolean hasNext = false;
        List<UserRoleResponse> content = users.stream().map(UserRoleResponse::from).toList();
        if (users.size() > size) {
            hasNext = true;
            content = content.subList(0, size);
        }

        return new UserRolePageResponse(content, hasNext);
    }

}
