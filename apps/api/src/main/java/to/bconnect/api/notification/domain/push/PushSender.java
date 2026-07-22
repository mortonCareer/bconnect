package to.bconnect.api.notification.domain.push;

public interface PushSender {
    PushSendResult send(String endpointArn, PushPayload payload);
}
