package wap.web2.server.member.entity;

import java.util.Arrays;

public enum Role {

    ADMIN,     // WAP 임원진 및 waps 개발자
    MEMBER,    // 왑 회원
    GUEST;     // 비회원

    public static Role from(String value) {
        return Arrays.stream(Role.values())
                .filter(role -> role.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("[ERROR] 유효하지 않은 역할입니다: " + value));
    }

}
