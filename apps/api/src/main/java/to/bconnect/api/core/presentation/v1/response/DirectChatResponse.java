package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.chat.DirectChat;

import java.time.LocalDateTime;

public record DirectChatResponse(
        Long id,
        MemberSummaryResponse member,
        MessageResponse lastMessage,
        Long unreadCount,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static DirectChatResponse of(DirectChat directChat, MemberSummaryResponse member) {
        return new DirectChatResponse(
                directChat.id(),
                member,
                directChat.lastMessage() != null ? MessageResponse.of(directChat.lastMessage()) : null,
                directChat.unreadCount(),
                directChat.createdAt(),
                directChat.modifiedAt()
        );
    }
}
