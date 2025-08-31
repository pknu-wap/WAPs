package wap.web2.server.teambuild.dto;

import java.util.LinkedList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.teambuild.entity.Position;

@Getter
@NoArgsConstructor
public class RecruitInfo {

    private Long leaderId;
    private Long projectId;
    private Position position;
    private Integer capacity;
    private List<Long> userIds;

    public RecruitInfo(Long leaderId, Long projectId, Position position, Integer capacity, List<Long> userIds) {
        this.leaderId = leaderId;
        this.projectId = projectId;
        this.position = position;
        this.capacity = capacity;
        this.userIds = new LinkedList<>(userIds);
    }
}
