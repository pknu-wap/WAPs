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
import wap.web2.server.exception.ConflictException;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "vote_meta", uniqueConstraints = { @UniqueConstraint(columnNames = { "semester" }) })
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
    private boolean isResultPublic = false;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
        name = "vote_meta_participants",
        joinColumns = @JoinColumn(name = "vote_meta_id"),
        uniqueConstraints = @UniqueConstraint(columnNames = { "vote_meta_id", "participants" })
    )
    private List<Long> participants = new ArrayList<>();

    // 열린 투표를 의미
    private VoteMeta(String semester, Long createdBy, List<Long> participants) {
        this.semester = semester;
        this.createdBy = createdBy;
        this.status = VoteStatus.VOTING;
        this.participants = participants;
    }

    public void close(Long userId) {
        if (this.status != VoteStatus.VOTING) {
            throw new ConflictException("진행 중인 투표만 종료할 수 있습니다.");
        }
        this.status = VoteStatus.ENDED;
        this.closedAt = LocalDateTime.now();
        this.closedBy = userId;
        this.isResultPublic = false;
    }

    public void changeResultVisibility(boolean isPublic) {
        if (isPublic && this.status != VoteStatus.ENDED) {
            throw new ConflictException("종료된 투표만 결과를 공개할 수 있습니다.");
        }
        this.isResultPublic = isPublic;
    }

    public static VoteMeta of(String semester, Long createdBy, Set<Long> projectIds) {
        return new VoteMeta(semester, createdBy, new ArrayList<>(projectIds));
    }
}
