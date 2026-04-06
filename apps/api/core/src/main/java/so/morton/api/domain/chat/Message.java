package so.morton.api.domain.chat;

import so.morton.api.storage.domain.chat.MessageEntity;

import java.time.LocalDateTime;

public record Message(
    Long id,
    Long chatId,
    Long memberId,
    String content,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Message of(MessageEntity entity) {
        return new Message(
                entity.getId(),
                entity.getChatId(),
                entity.getmemberId(),
                entity.getContent(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
