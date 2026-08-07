package to.bconnect.api.notification.domain.push;

import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationType;

import static to.bconnect.api.common.CommonUtils.truncate;

public record PushNotification(
        Long id,
        Long receiverId,
        String title,
        String body,
        NotificationReferenceType referenceType,
        Long referenceId
) {
    private static final int PREVIEW_MAX = 100;

    public PushNotification(Long id, Long receiverId, NotificationType type, String senderName,
                            NotificationReferenceType referenceType, Long referenceId, String body) {
        this(id, receiverId, type.render(senderName), truncate(body, PREVIEW_MAX), referenceType, referenceId);
    }
}
