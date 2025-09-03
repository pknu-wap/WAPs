package wap.web2.server.teambuild.dto;

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
public class ApplyInfo {

    private Long userId;
    private Long projectId;
    private Integer priority;
    private Position position;

    // test에 쓰이는 생성자 (나중에 교체해야함)
    public ApplyInfo(int priority, Position position, Long userId, Long projectId) {
        this.userId = userId;
        this.projectId = projectId;
        this.priority = priority;
        this.position = position;
    }

}
