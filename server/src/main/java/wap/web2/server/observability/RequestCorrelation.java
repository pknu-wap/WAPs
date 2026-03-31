package wap.web2.server.observability;

public final class RequestCorrelation {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String REQUEST_ID_ATTRIBUTE = RequestCorrelation.class.getName() + ".requestId";
    public static final String REQUEST_ID_MDC_KEY = "requestId";

    private RequestCorrelation() {
    }
}
