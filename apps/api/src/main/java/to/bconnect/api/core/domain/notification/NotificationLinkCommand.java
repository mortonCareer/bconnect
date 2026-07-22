package to.bconnect.api.core.domain.notification;

import java.util.Set;

public record NotificationLinkCommand(
        Long senderId,
        Set<Long> receiverIds,
        String typeCode,
        Long referenceId,
        String content,
        NotificationArgs args
) {}
