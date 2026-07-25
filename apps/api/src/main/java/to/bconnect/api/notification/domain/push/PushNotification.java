package to.bconnect.api.notification.domain.push;

import to.bconnect.api.storage.notification.NotificationType;

import java.util.LinkedHashMap;
import java.util.Map;

public record PushNotification(NotificationType type, Long referenceId, String title, String body, String link) {

    public PushPayload toPayload(Long notificationId) {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("notification_id", String.valueOf(notificationId));
        data.put("type_code", type.code());
        data.put("reference_type", type.referenceType().name().toLowerCase());
        data.put("reference_id", referenceId == null ? "" : String.valueOf(referenceId));
        return new PushPayload(title, body, link, data);
    }
}
