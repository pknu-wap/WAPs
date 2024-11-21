package wap.web2.server.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.domain.Comment;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class CommentDto {
    private Long commentId;
    private String commenter;
    private String commentContent;

    public static CommentDto from (Comment comment) {
        return CommentDto.builder()
                .commentId((comment.getCommentId()))
                .commentContent(comment.getCommentContent())
                .commenter(comment.getCommenter())
                .build();
    }
}
