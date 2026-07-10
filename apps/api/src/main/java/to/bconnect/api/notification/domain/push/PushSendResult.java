package to.bconnect.api.notification.domain.push;

public record PushSendResult(String endpointArn, Status status, String messageId) {

    public enum Status {
        SUCCESS,
        EXPIRED,
        INVALID,
        FAILED
    }

    public static PushSendResult success(String endpointArn, String messageId) {
        return new PushSendResult(endpointArn, Status.SUCCESS, messageId);
    }

    public static PushSendResult expired(String endpointArn) {
        return new PushSendResult(endpointArn, Status.EXPIRED, null);
    }

    public static PushSendResult invalid(String endpointArn) {
        return new PushSendResult(endpointArn, Status.INVALID, null);
    }

    public static PushSendResult failed(String endpointArn) {
        return new PushSendResult(endpointArn, Status.FAILED, null);
    }
}
