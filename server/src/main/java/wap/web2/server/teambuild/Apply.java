package wap.web2.server.teambuild;

import java.util.ArrayList;
import java.util.List;

public class Apply {
    private String projectName;
    private String position;
    private Integer priority;

    public Apply(String projectName, String position, Integer priority) {
        this.projectName = projectName;
        this.position = position;
        this.priority = priority;
    }

    public static List<Apply> of(String position, List<String> names) {
        List<Apply> applies = new ArrayList();

        for(int i = 0; i < names.size(); ++i) {
            applies.add(new Apply(names.get(i), position, i));
        }

        return applies;
    }

    public String getProjectName() {
        return this.projectName;
    }

    public String getPosition() {
        return this.position;
    }

    public Integer getPriority() {
        return this.priority;
    }
}
