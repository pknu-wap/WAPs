package wap.web2.server.project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRecruitWish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 팀에서 희망하는 지원자 ID
    @Column(nullable = false)
    private Long applicantId;

    // 희망 우선순위
    @Column(nullable = false)
    private Integer priority;

    // 알고리즘에서 실제 선택 여부
    @Column(nullable = false)
    @Builder.Default
    private Boolean isSelected = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_recruit_id", nullable = false)
    private ProjectRecruit recruit;

}
