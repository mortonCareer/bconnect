package to.bconnect.api.core.domain.chat;

import to.bconnect.api.storage.chat.GroupChatEntity;

import java.time.OffsetDateTime;
import java.util.List;

public record GroupChat(
    Long id,
    String title,
    List<Long> participantIds,
    Message lastMessage,
    Long unreadCount,
    OffsetDateTime createdAt,
    OffsetDateTime modifiedAt
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
