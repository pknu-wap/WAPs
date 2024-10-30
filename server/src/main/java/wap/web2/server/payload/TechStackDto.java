package wap.web2.server.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wap.web2.server.domain.TechStack;

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
}
