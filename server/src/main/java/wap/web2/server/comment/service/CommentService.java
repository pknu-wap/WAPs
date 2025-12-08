package wap.web2.server.comment.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.comment.dto.request.CommentCreateRequest;
import wap.web2.server.comment.entity.Comment;
import wap.web2.server.comment.repository.CommentRepository;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.project.entity.Project;
import wap.web2.server.project.repository.ProjectRepository;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public void save(Long projectId, CommentCreateRequest request, UserPrincipal userPrincipal) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] Project not found"));
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] User not found"));

        commentRepository.save(request.toEntity(project, user));
    }

    @Transactional
    public void delete(Long commentId, UserPrincipal userPrincipal) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] Comment not found"));
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] User not found"));

        if (!comment.isOwner(user)) {
            throw new IllegalArgumentException("[ERROR] Is not your comment");
        }
        commentRepository.delete(comment);
    }

}
