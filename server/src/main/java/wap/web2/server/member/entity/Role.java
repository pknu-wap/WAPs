package wap.web2.server.member.entity;

import java.util.Arrays;

public enum Role {

    ROLE_ADMIN,     // WAP 임원진 및 waps 개발자
    ROLE_MEMBER,    // 왑 회원
    ROLE_USER,      // 비회원
    ROLE_GUEST;     // (default) 권한을 설정하지 않은 게스트

    public static Role from(String value) {
        return Arrays.stream(Role.values())
                .filter(role -> role.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 유효하지 않은 역할입니다: " + value));
    }

}
