package wap.web2.server.comment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.comment.entity.Comment;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class CommentDto {

    private Long commentId;
    private String commentContent;

    public static CommentDto from(Comment comment) {
        return CommentDto.builder()
                .commentId((comment.getCommentId()))
                .commentContent(comment.getCommentContent())
                .build();
    }
}
