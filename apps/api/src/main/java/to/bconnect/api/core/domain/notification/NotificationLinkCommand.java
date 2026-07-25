package to.bconnect.api.core.domain.notification;

import to.bconnect.api.storage.notification.NotificationArgs;
import to.bconnect.api.storage.notification.NotificationType;

import java.util.Set;

public record NotificationLinkCommand(
        Long senderId,
        Set<Long> receiverIds,
        NotificationType type,
        Long referenceId,
        String content,
        NotificationArgs args
) {
    public NotificationLinkCommand {
        receiverIds = Set.copyOf(receiverIds);
    }
}
