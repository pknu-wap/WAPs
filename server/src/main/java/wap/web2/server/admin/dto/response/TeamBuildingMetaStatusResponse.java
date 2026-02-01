package wap.web2.server.admin.dto.response;

import wap.web2.server.admin.entity.TeamBuildingStatus;

public record TeamBuildingMetaStatusResponse(
        TeamBuildingStatus status
) {

    public static TeamBuildingMetaStatusResponse of(TeamBuildingStatus status) {
        return new TeamBuildingMetaStatusResponse(status);
    }

}
