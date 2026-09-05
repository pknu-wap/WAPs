package wap.web2.server.exception;

public class ForbiddenException extends BusinessException {

    public ForbiddenException(String message) {
        super(ErrorCode.AUTH_FORBIDDEN, message);
    }
}
