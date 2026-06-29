package to.bconnect.api.core.domain.notification;

import to.bconnect.api.storage.notification.NotificationEntity;

import java.time.LocalDateTime;

public record Notification(
        Long id,
        Long senderId,
        Long receiverId,
        String typeCode,
        Long referenceId,
        String content,
        boolean read,
        LocalDateTime createdAt
) {
    public static Notification of(NotificationEntity entity) {
        return new Notification(
                entity.getId(),
                entity.getSenderId(),
                entity.getReceiverId(),
                entity.getTypeCode(),
                entity.getReferenceId(),
                entity.getContent(),
                entity.isRead(),
                entity.getCreatedAt()
        );
    }
}
