package to.bconnect.api.notification.domain.push;

import to.bconnect.api.storage.notification.NotificationArgs;
import to.bconnect.api.storage.notification.NotificationType;

import java.util.LinkedHashMap;
import java.util.Map;

public record PushNotification(NotificationType type, Long referenceId, String title, String body, String link) {

    private static final int PREVIEW_MAX = 100;

    public static PushNotification of(NotificationType type, Long referenceId, String content, NotificationArgs args) {
        return new PushNotification(type, referenceId, type.render(args), truncate(content), type.link(referenceId));
    }

    public PushPayload toPayload(Long notificationId) {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("notification_id", String.valueOf(notificationId));
        data.put("type_code", type.code());
        data.put("reference_type", type.referenceType().name().toLowerCase());
        data.put("reference_id", referenceId == null ? "" : String.valueOf(referenceId));
        return new PushPayload(title, body, link, data);
    }

    private static String truncate(String text) {
        if (text == null) return "";
        return text.length() <= PREVIEW_MAX ? text : text.substring(0, PREVIEW_MAX) + "…";
    }
}
