package to.bconnect.api.core.domain.chat;

import to.bconnect.api.storage.chat.ChatType;

public record ChatCreatedEvent(
        Long chatId,
        ChatType chatType
) {
}
