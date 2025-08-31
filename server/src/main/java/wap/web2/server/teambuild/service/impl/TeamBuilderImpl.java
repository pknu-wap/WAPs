package wap.web2.server.teambuild.service.impl;

import java.util.List;
import java.util.Map;
import wap.web2.server.teambuild.dto.ApplyInfo;
import wap.web2.server.teambuild.dto.RecruitInfo;
import wap.web2.server.teambuild.service.TeamBuilder;

public class TeamBuilderImpl implements TeamBuilder {

    @Override
    public Map<Long, List<Long>> allocate(Map<Long, List<ApplyInfo>> applyMap,
                                          Map<Long, RecruitInfo> leaderPriorityMap) {
        // TODO: 알고리즘 구현
        return Map.of();
    }

}
