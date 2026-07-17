package to.bconnect.api.core.domain.chat;

import to.bconnect.api.storage.chat.GroupChatEntity;

import java.time.Instant;
import java.util.List;

public record GroupChat(
    Long id,
    String title,
    List<Long> participantIds,
    Message lastMessage,
    Long unreadCount,
    Instant createdAt,
    Instant modifiedAt
) {
    public static GroupChat of(GroupChatEntity entity, List<Long> participantIds, Message lastMessage, Long unreadCount) {
        return new GroupChat(
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
