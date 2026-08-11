package to.bconnect.api.notification.domain.push;

public interface PushSender {

    PushSendResult send(String endpoint, PushNotification command);
}
