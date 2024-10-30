package wap.web2.server.payload.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ProjectResponse {

    private String title;
    private String projectType;
    private String content;
    private String summary;
    private Long semester;
    private Long vote;
    private Long projectYear;
    private String thumbnail;


}
