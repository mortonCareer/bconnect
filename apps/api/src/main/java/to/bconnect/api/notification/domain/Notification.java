package to.bconnect.api.notification.domain;

import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationSenderType;
import to.bconnect.api.storage.notification.NotificationType;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

public record Notification(
        Long id,
        Long memberId,
        NotificationType type,
        NotificationSenderType senderType,
        Long senderId,
        NotificationReferenceType referenceType,
        Long referenceId,
        boolean read,
        Instant createdAt
) {
    public static Notification of(NotificationEntity entity) {
        return new Notification(
                entity.getId(),
                entity.getMemberId(),
                entity.getType(),
                entity.getSenderType(),
                entity.getSenderId(),
                entity.getReferenceType(),
                entity.getReferenceId(),
                entity.isRead(),
                entity.getCreatedAt()
        );
    }

    public static List<Long> senderIds(List<Notification> notifications, NotificationSenderType senderType) {
        return notifications.stream()
                .filter(it -> it.senderType() == senderType)
                .map(Notification::senderId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }
}
