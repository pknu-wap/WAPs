package wap.web2.server.teambuild.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import java.time.YearMonth;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRecruit {

    public static final int SECOND_SEMESTER_MONTH = 6;
    public static final String FIRST_SEMESTER = "-01";
    public static final String SECOND_SEMESTER = "-02";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long leaderId;

    @Column(nullable = false)
    private Long projectId;

    // 모집 분야
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Position position;

    // 팀원 제한 수
    @Column(nullable = false)
    private Integer capacity;

    // 현재 선택된 인원 수
    @Column(nullable = false)
    @Builder.Default
    private Integer currentCount = 0;

    // 완료 여부
    @Column(nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

    @Column(nullable = false, length = 7)
    private String semester;     // "year-semester"

    // 희망 지원자 목록
    @Setter
    @OneToMany(mappedBy = "recruit", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProjectRecruitWish> wishList;

    @PrePersist
    private void onCreate() {
        if (this.semester == null) {
            YearMonth now = YearMonth.now();
            this.semester = now.getMonthValue() <= SECOND_SEMESTER_MONTH
                    ? now.getYear() + FIRST_SEMESTER
                    : now.getYear() + SECOND_SEMESTER;
        }
    }

}
