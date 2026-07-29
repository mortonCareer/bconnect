package to.bconnect.api.socket.message;

import to.bconnect.api.core.domain.chat.Message;

import java.util.Set;

public record SocketMessageSentEvent(
        Set<Long> activeIds,
        Set<Long> inactiveIds,
        Message message
) {}
