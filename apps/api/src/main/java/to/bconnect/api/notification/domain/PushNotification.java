package to.bconnect.api.notification.domain;

import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationSenderType;
import to.bconnect.api.storage.notification.NotificationType;

public record PushNotification(
        Long memberId,
        NotificationType type,
        NotificationSenderType senderType,
        Long senderId,
        String senderName,
        NotificationReferenceType referenceType,
        Long referenceId,
        String body
) {
}
