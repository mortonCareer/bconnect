package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.chat.Chat;

import java.time.LocalDateTime;
import java.util.List;

public record ChatResponse(
        Long id,
        String title,
        List<MaskedMemberResponse> participants,
        MessageResponse lastMessage,
        Long unreadCount,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static ChatResponse of(Chat chat) {
        return new ChatResponse(
                chat.id(),
                chat.title(),
                chat.participants().stream()
                        .map(MaskedMemberResponse::of)
                        .toList(),
                chat.lastMessage() != null ? MessageResponse.of(chat.lastMessage()) : null,
                chat.unreadCount(),
                chat.createdAt(),
                chat.modifiedAt()
        );
    }
}
