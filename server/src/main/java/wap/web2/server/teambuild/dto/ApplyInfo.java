package wap.web2.server.teambuild.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.teambuild.entity.Position;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ApplyInfo {

    private Integer priority;
    private Position position;
    private Long userId;
    private Long projectId;
}
