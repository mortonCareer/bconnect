package to.bconnect.api.core.domain.chat;

import to.bconnect.api.storage.chat.DirectChatEntity;

import java.time.OffsetDateTime;

public record DirectChat(
    Long id,
    Long memberId,
    Message lastMessage,
    Long unreadCount,
    OffsetDateTime createdAt,
    OffsetDateTime modifiedAt
) {
    public static DirectChat of(DirectChatEntity entity, Long memberId, Message lastMessage, Long unreadCount) {
        return new DirectChat(
                entity.getId(),
                memberId,
                lastMessage,
                unreadCount,
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
