package wap.web2.server.admin.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.member.entity.Role;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RoleChangeRequest {

    @NotNull
    private Role newRole;
    private List<Long> userIds;

}
