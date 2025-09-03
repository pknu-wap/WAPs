package wap.web2.server.teambuild.dto;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import wap.web2.server.teambuild.entity.Position;

@ToString
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecruitInfo {

    private Long leaderId;
    private Long projectId;
    private Position position;
    private Integer capacity;
    private Set<Long> userIds;

    public RecruitInfo(Long leaderId, Long projectId, Position position, Integer capacity, List<Long> userIds) {
        this.leaderId = leaderId;
        this.projectId = projectId;
        this.position = position;
        this.capacity = capacity;
        this.userIds = new LinkedHashSet<>(userIds);
    }

}
