package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.chat.Chat;

import java.time.LocalDateTime;
import java.util.List;

public record ChatResponse(
        Long id,
        String title,
        List<Long> participantIds,
        MessageResponse lastMessage,
        int unreadCount,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static ChatResponse of(Chat chat) {
        return new ChatResponse(
                chat.id(),
                chat.title(),
                chat.participantIds(),
                MessageResponse.of(chat.lastMessage()),
                chat.unreadCount(),
                chat.createdAt(),
                chat.modifiedAt()
        );
    }
}
