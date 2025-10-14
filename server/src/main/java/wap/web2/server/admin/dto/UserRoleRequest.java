package wap.web2.server.admin.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import wap.web2.server.member.entity.Role;

@Getter
@AllArgsConstructor
public class UserRoleRequest {

    @NotNull
    private Role newRole;
    private List<Long> userIds;
}
