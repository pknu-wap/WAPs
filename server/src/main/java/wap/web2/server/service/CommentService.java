package wap.web2.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.domain.Comment;
import wap.web2.server.domain.Project;
import wap.web2.server.payload.request.CommentCreateRequest;
import wap.web2.server.repository.CommentRepository;
import wap.web2.server.repository.ProjectRepository;

@RequiredArgsConstructor
@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final ProjectRepository projectRepository;

    @Transactional
    public void save(Long projectId, CommentCreateRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로젝트"));

        Comment comment = request.toEntity(project);

        commentRepository.save(comment);
    }


}
