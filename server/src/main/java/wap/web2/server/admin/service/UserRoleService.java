package wap.web2.server.admin.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import wap.web2.server.admin.dto.RoleChangeResponse;
import wap.web2.server.admin.dto.UserRoleRequest;
import wap.web2.server.admin.repository.UserRoleRepository;
import wap.web2.server.member.entity.Role;

@Service
@RequiredArgsConstructor
public class UserRoleService {

    private final UserRoleRepository userRoleRepository;

    public RoleChangeResponse change(UserRoleRequest userRoleRequest) {
        List<Long> userIds = userRoleRequest.getUserIds();
        Role newRole = userRoleRequest.getNewRole();

        if (userIds.isEmpty()) {
            return new RoleChangeResponse(0, newRole);
        }

        int updated = userRoleRepository.updateRoleByIds(newRole, userIds);
        return new RoleChangeResponse(updated, newRole);
    }
}
