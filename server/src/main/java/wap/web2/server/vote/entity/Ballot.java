package wap.web2.server.vote.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.member.entity.Role;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Ballot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 7)
    private String semester;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Role userRole;

    private Long projectId;

    private LocalDateTime createdAt;

    private Ballot(String semester, Long userId, Role userRole, Long projectId) {
        this.semester = semester;
        this.userId = userId;
        this.projectId = projectId;
        this.userRole = userRole;
    }

    public static Ballot of(String semester, Long userId, Role userRole, Long projectId) {
        return new Ballot(semester, userId, userRole, projectId);
    }
}
