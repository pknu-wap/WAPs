package wap.web2.server.payload.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.domain.Comment;
import wap.web2.server.domain.Project;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CommentCreateRequest {

    private String commentContent;
    private String commenter;
    private String password;

    public Comment toEntity(Project project) {
        return Comment.builder()
                .commentContent(commentContent)
                .commenter(commenter)
                .password(password)
                .project(project)
                .build();
    }

}
