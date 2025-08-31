package wap.web2.server.teambuild.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.teambuild.entity.Position;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecruitInfo {

    private Long leaderId;
    private Long projectId;
    private Position position;
    private Integer capacity;
    private List<Long> userIds;

}
