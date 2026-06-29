package to.bconnect.api.core.domain.notification;

import java.util.Map;

public record ChatPushRequested(
        Long senderId,
        Long chatId,
        String preview,
        Map<Long, Long> targetNotificationIds
) {}
