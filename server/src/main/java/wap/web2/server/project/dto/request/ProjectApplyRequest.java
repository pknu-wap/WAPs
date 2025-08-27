package wap.web2.server.project.dto.request;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProjectApplyRequest {

    private List<Long> projectIds;

}
