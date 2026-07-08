package to.bconnect.api.socket.message;

import java.util.List;
import java.util.Set;

public record ChatMessageSentEvent(
        Long senderId,
        Long chatId,
        List<Long> recipientIds,
        Set<Long> activeMemberIds,
        String preview
) {}
