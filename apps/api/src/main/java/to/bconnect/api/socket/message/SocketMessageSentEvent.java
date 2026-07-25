package to.bconnect.api.socket.message;

import java.util.Set;

public record SocketMessageSentEvent(
        Long chatId,
        Long senderId,
        Set<Long> activeIds,
        Set<Long> inactiveIds,
        String preview
) {}
