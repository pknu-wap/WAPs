package wap.web2.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wap.web2.server.domain.Comment;

public interface CommentRepository extends JpaRepository<Comment, Long> {

}
