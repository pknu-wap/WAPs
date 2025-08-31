package wap.web2.server.teambuild.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.teambuild.entity.Position;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyInfo {

    private Long userId;
    private Long projectId;
    private Integer priority;
    private Position position;

}
