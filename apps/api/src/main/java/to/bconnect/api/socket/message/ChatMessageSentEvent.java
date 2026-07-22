package to.bconnect.api.socket.message;

import java.util.List;

public record ChatMessageSentEvent(
        Long senderId,
        Long chatId,
        List<Long> recipientIds,
        String preview
) {}
