package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.chat.DirectChat;
import to.bconnect.api.core.domain.member.Member;

import java.time.OffsetDateTime;

public record DirectChatResponse(
        Long id,
        MemberSummaryResponse member,
        MessageResponse lastMessage,
        Long unreadCount,
        OffsetDateTime createdAt,
        OffsetDateTime modifiedAt
) {
    public static DirectChatResponse of(DirectChat directChat, Member member, String picture) {
        return new DirectChatResponse(
                directChat.id(),
                MemberSummaryResponse.of(member, picture),
                directChat.lastMessage() != null ? MessageResponse.of(directChat.lastMessage()) : null,
                directChat.unreadCount(),
                directChat.createdAt(),
                directChat.modifiedAt()
        );
    }
}
