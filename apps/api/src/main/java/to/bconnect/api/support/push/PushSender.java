package to.bconnect.api.support.push;

public interface PushSender {
    PushSendResult send(String endpointArn, PushPayload payload);
}
