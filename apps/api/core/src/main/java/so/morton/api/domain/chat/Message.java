package so.morton.api.domain.chat;

import so.morton.api.storage.domain.chat.MessageEntity;
import so.morton.api.storage.value.MessageType;

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
