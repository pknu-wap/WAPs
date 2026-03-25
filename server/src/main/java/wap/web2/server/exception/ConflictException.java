package wap.web2.server.exception;

public class ConflictException extends BusinessException {

    public ConflictException(String message) {
        super(ErrorCode.COMMON_CONFLICT, message);
    }

    public ConflictException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }
}
