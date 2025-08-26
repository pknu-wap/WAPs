package wap.web2.server.project.entity;

import lombok.Getter;

@Getter
public enum TechStackName {

    // Frontend
    REACT("React"),
    VUE("Vue"),
    HTML("HTML"),
    CSS("CSS"),
    JAVASCRIPT("JavaScript"),
    TYPESCRIPT("TypeScript"),

    // Backend
    SPRING("Spring"),
    DJANGO("Django"),
    FLASK("Flask"),
    EXPRESS("Express"),
    NODE_JS("Node.js"),
    FAST_API("FastApi"),

    // Mobile App
    FLUTTER("Flutter"),
    REACT_NATIVE("React Native"),
    SWIFT("Swift"),
    KOTLIN("Kotlin"),
    JAVA("Java"),

    // DevOps 및 배포
    DOCKER("Docker"),
    KUBERNETES("Kubernetes"),
    JENKINS("Jenkins"),
    GITHUB_ACTIONS("GitHub Actions"),
    AWS("AWS"),
    AZURE("Azure"),
    GOOGLE_CLOUD("Google Cloud"),

    // 게임
    UNITY("Unity"),
    UNREAL_ENGINE("Unreal Engine"),

    // AI
    TORCH("torch"),
    TENSERFLOW("tenserflow"),
    YOLO("YOLO");

    private final String name;

    TechStackName(String name) {
        this.name = name;
    }

}
