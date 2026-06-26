package to.bconnect.api.core.domain.chat;

import to.bconnect.api.storage.chat.DirectChatEntity;

import java.time.LocalDateTime;

public record DirectChat(
    Long id,
    Long memberId,
    Message lastMessage,
    Long unreadCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
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
