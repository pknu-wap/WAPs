package wap.web2.server.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.project.entity.TechStack;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TechStackDto {
    private String techStackName;
    private String techStackType;

    // 스트림의 각 요소가 TechStackDto 객체이기 때문에 자기 자신의 필드 값을 활용해 변환이 가능함으로
    // 매개변수 필요 없음
    // static 일 필요 없음
    public TechStack toEntity() {
        return TechStack.builder()
                .techStackName(techStackName)
                .techStackType(techStackType)
                .build();
    }

    // TechStack 을 TechStackDto 로 변환하는 정적 팩토리 메서드
    // 엔티티를 바로 Response 로 바꿀 시 TechStack 의 Project 필드로 인해 연쇄적으로 데이터가 쌓임
    public static TechStackDto from(TechStack techStack) {
        return TechStackDto.builder()
            .techStackName(techStack.getTechStackName())
            .techStackType(techStack.getTechStackType())
            .build();
    }
}
