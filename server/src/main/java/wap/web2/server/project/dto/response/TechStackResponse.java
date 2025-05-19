package wap.web2.server.project.dto.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
@AllArgsConstructor
// 기술스택 리스트를 value 로 가지는 JSON
public class TechStackResponse {

    private List<TechStackInfoResponse> techStackResponse;
}

