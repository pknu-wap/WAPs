package wap.web2.server.teambuild.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TempProject {

    private Long id;
    private String title;
    private String description;
    private List<String> techStack;
    private String deadline;

}
