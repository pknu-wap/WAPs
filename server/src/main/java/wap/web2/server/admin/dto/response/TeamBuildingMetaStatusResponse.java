package wap.web2.server.admin.dto.response;

import wap.web2.server.admin.entity.TeamBuildingMeta;
import wap.web2.server.admin.entity.TeamBuildingStatus;

public record TeamBuildingMetaStatusResponse(
        TeamBuildingStatus status,
        Integer round
) {

    public static TeamBuildingMetaStatusResponse of(TeamBuildingMeta meta) {
        return new TeamBuildingMetaStatusResponse(meta.getStatus(), meta.getRound());
    }

}
