package wap.web2.server.member.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MemberType {
    NEW("신입"),
    ASSOCIATE("준회원"),
    REGULAR("정회원"),
    UNDECIDED("미정");

    private final String label;
}
