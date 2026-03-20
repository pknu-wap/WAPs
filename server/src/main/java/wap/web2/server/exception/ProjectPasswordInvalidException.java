package wap.web2.server.exception;

public class ProjectPasswordInvalidException extends BusinessException {

    public ProjectPasswordInvalidException() {
        super(ErrorCode.PROJECT_PASSWORD_INVALID);
    }

    public ProjectPasswordInvalidException(String message) {
        super(ErrorCode.PROJECT_PASSWORD_INVALID, message);
    }
}
