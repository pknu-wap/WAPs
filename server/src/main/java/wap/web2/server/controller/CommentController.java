package wap.web2.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wap.web2.server.payload.request.CommentCreateRequest;
import wap.web2.server.service.CommentService;

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
    
}
