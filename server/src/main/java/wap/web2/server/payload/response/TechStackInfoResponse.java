package wap.web2.server.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import wap.web2.server.domain.TechStackName;
import wap.web2.server.domain.TechStackType;

@Builder
@Getter
@AllArgsConstructor
// 기술스택 리스트, 기술스택명에 따라 기술스택 타입이 매칭됨
public class TechStackInfoResponse {
    private TechStackName techStackName;
    private TechStackType techStackType;

    // 컨트롤러에서 쓰이는 static 메서드
    public static TechStackType getTechStackType(TechStackName techStackName) {
        switch (techStackName) {
            case REACT:
            case VUE:
            case HTML:
            case CSS:
            case JAVASCRIPT:
            case TYPESCRIPT:
                return TechStackType.FRONT;
            case SPRING:
            case DJANGO:
            case FLASK:
            case EXPRESS:
            case NODE_JS:
                return TechStackType.BACK;
            case FLUTTER:
            case REACT_NATIVE:
            case SWIFT:
            case KOTLIN:
            case JAVA:
                return TechStackType.APP;
            case DOCKER:
            case KUBERNETES:
            case JENKINS:
            case GITHUB_ACTIONS:
            case AWS:
            case AZURE:
            case GOOGLE_CLOUD:
                return TechStackType.DEPLOYMENT;
            case UNITY:
            case UNREAL_ENGINE:
                return TechStackType.GAME;
            default:
                throw new IllegalArgumentException("Unknown TechStackName: " + techStackName);
        }
    }
}
