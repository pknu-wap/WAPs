package wap.web2.server.calendar.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String title;

    @Column
    private String content;

    @Column
    private String target;  // 참여 대상을 String으로 유연하게 저장

    @Column
    private LocalDateTime date;

    @Column
    private boolean isExpired;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // TODO: 서버 설정 시간과 일정 시간의 시간차 문제 있을수도 있음
    //  TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul")); 을 application에 설정
    @PrePersist
    public void checkExpired() {
        this.isExpired = date.isBefore(LocalDateTime.now());
    }

}
