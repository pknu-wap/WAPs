package wap.web2.server.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class VoteMeta {

    @Id
    @Column
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 7)
    private String semester;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private VoteStatus status;

    @Column
    private Long createdBy;

    @Column
    @CreatedDate
    private LocalDateTime createdAt;

    @Column
    private Long closedBy;

    @Column
    private LocalDateTime closedAt;

    private VoteMeta(String semester, Long createdBy) {
        this.semester = semester;
        this.createdBy = createdBy;
        this.status = VoteStatus.OPEN;
    }

    public static VoteMeta of(String semester, Long createdBy) {
        return new VoteMeta(semester, createdBy);
    }

}
