package wap.web2.server.teambuild.dto;

import java.util.List;
import wap.web2.server.teambuild.entity.Position;

public class RecruitInfo {

    private Long leaderId;
    private Long projectId;
    private Position position;
    private Integer capacity;
    private List<Long> userIds;

}
