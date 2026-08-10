package to.bconnect.api.socket.message;

import to.bconnect.api.storage.chat.MessageType;

import java.util.List;

public record SendMessage(
        MessageType type,
        String content,
        String preview,
        List<Long> attachmentIds
) {}
