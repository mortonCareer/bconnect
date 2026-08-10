package to.bconnect.api.notification.domain;

import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationSenderType;
import to.bconnect.api.storage.notification.NotificationType;

public record CreateNotification(
        Long memberId,
        NotificationType type,
        NotificationSenderType senderType,
        Long senderId,
        NotificationReferenceType referenceType,
        Long referenceId
) {
}
