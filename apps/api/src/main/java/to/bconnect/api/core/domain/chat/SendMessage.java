package to.bconnect.api.core.domain.chat;

import to.bconnect.api.storage.chat.MessageType;

import java.util.List;

public record SendMessage(
        MessageType type,
        String content,
        List<Long> attachmentIds
) {}
