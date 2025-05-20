package wap.web2.server.comment.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.comment.dto.request.CommentCreateRequest;
import wap.web2.server.comment.service.CommentService;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.ouath2.security.UserPrincipal;

@RequiredArgsConstructor
@RestController
@RequestMapping("/comment")
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/{projectId}")
    public ResponseEntity<?> createComment(@PathVariable("projectId") Long projectId,
                                           @RequestBody CommentCreateRequest request,
                                           @CurrentUser UserPrincipal userPrincipal) {
        commentService.save(projectId, request, userPrincipal);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<String> deleteComment(@PathVariable("commentId") Long commentId,
                                                @CurrentUser UserPrincipal userPrincipal) {
        try {
            commentService.delete(commentId, userPrincipal);
            return ResponseEntity.ok("댓글이 삭제되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }
}
