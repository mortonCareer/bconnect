package to.bconnect.api.core.domain.chat;

import to.bconnect.api.storage.chat.MessageEntity;
import to.bconnect.api.storage.chat.MessageType;

import java.time.OffsetDateTime;

public record Message(
    Long id,
    Long chatId,
    Long memberId,
    MessageType type,
    String content,
    OffsetDateTime createdAt,
    OffsetDateTime modifiedAt
) {
    public static Message of(MessageEntity entity) {
        return new Message(
                entity.getId(),
                entity.getChatId(),
                entity.getMemberId(),
                entity.getType(),
                entity.getContent(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
