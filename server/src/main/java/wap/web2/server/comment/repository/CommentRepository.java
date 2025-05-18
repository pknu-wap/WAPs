package wap.web2.server.comment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wap.web2.server.comment.entity.Comment;

public interface CommentRepository extends JpaRepository<Comment, Long> {

}
