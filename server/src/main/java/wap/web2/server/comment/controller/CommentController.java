package wap.web2.server.comment.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wap.web2.server.comment.dto.request.CommentCreateRequest;
import wap.web2.server.comment.dto.request.CommentDeleteRequest;
import wap.web2.server.comment.service.CommentService;

@RequiredArgsConstructor
@RestController
@RequestMapping("/comment")
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/{projectId}")
    public ResponseEntity<?> createComment(@PathVariable Long projectId, @RequestBody CommentCreateRequest request) {
        commentService.save(projectId, request);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<String> deleteBook(@PathVariable Long commentId, @RequestBody CommentDeleteRequest request) {
        boolean isDeleted = commentService.deleteCommentByPassword(commentId, request);
        if (isDeleted) {
            return ResponseEntity.ok("댓글이 삭제되었습니다.");
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("댓글 비밀번호가 일치하지 않습니다.");
        }
    }
}
