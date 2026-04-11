package wap.web2.server.exception;

public class InternalServerException extends BusinessException {

    public InternalServerException(String message) {
        super(ErrorCode.COMMON_INTERNAL_SERVER_ERROR, message);
    }

    public InternalServerException(String message, Throwable cause) {
        super(ErrorCode.COMMON_INTERNAL_SERVER_ERROR, message, cause);
    }
}
