package to.bconnect.api.socket.message;

import to.bconnect.api.core.domain.notification.NotificationEvent;

import java.util.Set;

public record SocketMessageSentEvent(
        Long chatId,
        Long senderId,
        Set<Long> activeIds,
        Set<Long> inactiveIds,
        String preview
) implements NotificationEvent {
    public SocketMessageSentEvent {
        activeIds = Set.copyOf(activeIds);
        inactiveIds = Set.copyOf(inactiveIds);
    }
}
