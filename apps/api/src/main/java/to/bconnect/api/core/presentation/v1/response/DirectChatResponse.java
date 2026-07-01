package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.chat.DirectChat;
import to.bconnect.api.security.member.Member;

import java.time.LocalDateTime;

public record DirectChatResponse(
        Long id,
        MemberSummaryResponse member,
        MessageResponse lastMessage,
        Long unreadCount,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static DirectChatResponse of(DirectChat directChat, Member member, String picture) {
        return new DirectChatResponse(
                directChat.id(),
                member != null ? MemberSummaryResponse.of(member, picture) : null,
                directChat.lastMessage() != null ? MessageResponse.of(directChat.lastMessage()) : null,
                directChat.unreadCount(),
                directChat.createdAt(),
                directChat.modifiedAt()
        );
    }
}
