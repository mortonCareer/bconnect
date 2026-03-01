package so.morton.api.domain.chat;

import so.morton.api.storage.domain.chat.ChatEntity;

import java.time.LocalDateTime;
import java.util.List;

public record Chat(
    Long id,
    String title,
    List<Long> participantIds,
    Message lastMessage,
    long unreadCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Chat of(ChatEntity entity, List<Long> participantIds, Message lastMessage, long unreadCount) {
        return new Chat(
                entity.getId(),
                entity.getTitle(),
                participantIds,
                lastMessage,
                unreadCount,
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
