package wap.web2.server.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class BadRequestException extends BusinessException {

    public BadRequestException(String message) {
        super(ErrorCode.COMMON_INVALID_INPUT, message);
    }

    public BadRequestException(String message, Throwable cause) {
        super(ErrorCode.COMMON_INVALID_INPUT, message, cause);
    }

}
