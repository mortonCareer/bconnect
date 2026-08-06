package to.bconnect.api.notification.domain;

import lombok.val;
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationSenderType;
import to.bconnect.api.storage.notification.NotificationType;

import java.util.List;
import java.util.stream.IntStream;

public record PushNotification(
        Long id,
        Long memberId,
        NotificationType type,
        NotificationSenderType senderType,
        Long senderId,
        String senderName,
        NotificationReferenceType referenceType,
        Long referenceId,
        String body
) {
    public static List<PushNotification> of(List<NotificationEntity> entities, List<PushNotification> commands) {
        return IntStream.range(0, entities.size())
                .mapToObj(it -> {
                    val command = commands.get(it);
                    return new PushNotification(
                            entities.get(it).getId(),
                            command.memberId(),
                            command.type(),
                            command.senderType(),
                            command.senderId(),
                            command.senderName(),
                            command.referenceType(),
                            command.referenceId(),
                            command.body());
                })
                .toList();
    }
}
