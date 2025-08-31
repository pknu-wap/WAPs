package wap.web2.server.teambuild.service;

import java.util.List;
import java.util.Map;
import wap.web2.server.teambuild.dto.ApplyInfo;
import wap.web2.server.teambuild.dto.RecruitInfo;

public interface TeamBuilder {

    Map<Long, List<Long>> allocate(Map<Long, List<ApplyInfo>> applyMap, Map<Long, RecruitInfo> leaderPriorityMap);

}
