package wap.web2.server.vote.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import wap.web2.server.member.entity.Role;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(indexes = {
        @Index(name = "idx_semester_userId", columnList = "semester, userId")
})
public class Ballot {

    @Id
    @Column
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 7)
    private String semester;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Role userRole;

    @Column
    private Long projectId;

    @CreatedDate
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
