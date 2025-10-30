package wap.web2.server.admin.dto;

import java.util.List;

public record UserRolePageResponse(
        List<UserRoleResponse> content,
        boolean hasNext
) {
}
