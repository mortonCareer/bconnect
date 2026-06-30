package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.chat.GroupChat;

import java.time.LocalDateTime;
import java.util.List;

public record GroupChatResponse(
        Long id,
        String title,
        List<MemberSummaryResponse> participants,
        MessageResponse lastMessage,
        Long unreadCount,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static GroupChatResponse of(GroupChat chat, List<MemberSummaryResponse> participants) {
        return new GroupChatResponse(
                chat.id(),
                chat.title(),
                participants,
                chat.lastMessage() != null ? MessageResponse.of(chat.lastMessage()) : null,
                chat.unreadCount(),
                chat.createdAt(),
                chat.modifiedAt()
        );
    }
}
