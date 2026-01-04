package so.morton.api.domain;

import so.morton.api.storage.entity.MessageEntity;

import java.time.LocalDateTime;

public record Message(
    Long id,
    Long chatId,
    Long senderId,
    String content,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Message of(MessageEntity entity) {
        return new Message(
                entity.getId(),
                entity.getChatId(),
                entity.getSenderId(),
                entity.getContent(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
