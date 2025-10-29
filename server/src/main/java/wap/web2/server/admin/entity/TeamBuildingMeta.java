package wap.web2.server.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TeamBuildingMeta {

    public TeamBuildingMeta(String semester) {
        this.semester = semester;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 7)
    private String semester;

    @Column(nullable = false)
    private boolean isOpen = false;

    @Column(nullable = false)
    private boolean canApply = false;

    @Column(nullable = false)
    private boolean canRecruit = false;

    // 팀빌딩을 열고 닫을 때엔 항상 지원과 모집 상태를 초기화한다.
    public void changeTo(boolean status) {
        this.isOpen = status;
        this.canApply = false;
        this.canRecruit = false;
    }
}
