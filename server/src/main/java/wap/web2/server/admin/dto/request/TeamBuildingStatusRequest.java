package wap.web2.server.admin.dto.request;

import wap.web2.server.admin.entity.TeamBuildingStatus;

public record TeamBuildingStatusRequest(String semester, TeamBuildingStatus status) {
}
