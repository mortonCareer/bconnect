package so.morton.api.domain;

import so.morton.api.storage.entity.ChatEntity;

import java.time.LocalDateTime;
import java.util.List;

public record Chat(
    Long id,
    String title,
    List<Long> participantIds,
    Message lastMessage,
    int unreadCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Chat of(ChatEntity entity, List<Long> participantIds, Message lastMessage, int unreadCount) {
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
