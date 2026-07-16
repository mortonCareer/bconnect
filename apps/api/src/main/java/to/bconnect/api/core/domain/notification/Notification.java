package to.bconnect.api.core.domain.notification;

import to.bconnect.api.storage.notification.NotificationEntity;

import java.time.Instant;

public record Notification(
        Long id,
        Long senderId,
        Long receiverId,
        String typeCode,
        Long referenceId,
        String content,
        NotificationArgs args,
        boolean read,
        Instant createdAt
) {
    public static Notification of(NotificationEntity entity) {
        return new Notification(
                entity.getId(),
                entity.getSenderId(),
                entity.getReceiverId(),
                entity.getTypeCode(),
                entity.getReferenceId(),
                entity.getContent(),
                NotificationArgs.fromJson(entity.getTemplateArgs()),
                entity.isRead(),
                entity.getCreatedAt()
        );
    }
}
