package wap.web2.server.exception;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(requiredProperties = {"field", "message"})
public record FieldErrorResponse(
    @Schema(example = "date") String field,
    @Schema(example = "출석 날짜는 한국 시간 기준 오늘 또는 미래 날짜여야 합니다.") String message,
    @Schema(description = "검증에 실패한 입력값. 문자열, 숫자, 객체 또는 null 등 원래 타입을 유지합니다.", nullable = true) Object rejectedValue
) {}
