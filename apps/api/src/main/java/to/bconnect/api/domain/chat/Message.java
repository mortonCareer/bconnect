package to.bconnect.api.domain.chat;

import to.bconnect.api.storage.domain.chat.MessageEntity;
import to.bconnect.api.storage.value.MessageType;

import java.time.LocalDateTime;

public record Message(
    Long id,
    Long chatId,
    Long memberId,
    MessageType type,
    String content,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
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
