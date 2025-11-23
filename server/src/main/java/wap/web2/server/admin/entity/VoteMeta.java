package wap.web2.server.admin.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
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
@Table(
        name = "vote_meta",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"semester"})
        }
)
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

    @Column(nullable = false)
    private boolean isResultPublic = true;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "vote_meta_participants",
            joinColumns = @JoinColumn(name = "vote_meta_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"vote_meta_id", "participants"})
    )
    private List<Long> participants = new ArrayList<>();

    // 열린 투표를 의미
    private VoteMeta(String semester, Long createdBy, List<Long> participants) {
        this.semester = semester;
        this.createdBy = createdBy;
        this.status = VoteStatus.VOTING;
        this.participants = participants;
    }

    public void reopenTo(Set<Long> projectIds) {
        this.participants = new ArrayList<>(projectIds);
        this.status = VoteStatus.VOTING;
    }

    public void close(Long userId) {
        this.status = VoteStatus.ENDED;
        this.closedAt = LocalDateTime.now();
        this.closedBy = userId;
    }

    public static VoteMeta of(String semester, Long createdBy, Set<Long> projectIds) {
        return new VoteMeta(semester, createdBy, new ArrayList<>(projectIds));
    }

}
