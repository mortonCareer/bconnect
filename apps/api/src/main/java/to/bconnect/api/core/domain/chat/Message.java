package to.bconnect.api.core.domain.chat;

import to.bconnect.api.storage.chat.MessageEntity;
import to.bconnect.api.storage.chat.MessageType;

import java.time.LocalDateTime;
import java.util.List;

public record Message(
    Long id,
    Long chatId,
    Long memberId,
    MessageType type,
    String content,
    List<Long> attachmentIds,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Message of(MessageEntity entity) {
        return of(entity, List.of());
    }

    public static Message of(MessageEntity entity, List<Long> attachmentIds) {
        return new Message(
                entity.getId(),
                entity.getChatId(),
                entity.getMemberId(),
                entity.getType(),
                entity.getContent(),
                attachmentIds,
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
