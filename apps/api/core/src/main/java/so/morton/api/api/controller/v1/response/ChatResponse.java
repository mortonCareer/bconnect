package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.chat.ChatDetail;

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
    public static ChatResponse of(ChatDetail chatDetail) {
        return new ChatResponse(
                chatDetail.id(),
                chatDetail.title(),
                chatDetail.participants().stream()
                        .map(MaskedMemberResponse::of)
                        .toList(),
                chatDetail.lastMessage() != null ? MessageResponse.of(chatDetail.lastMessage()) : null,
                chatDetail.unreadCount(),
                chatDetail.createdAt(),
                chatDetail.modifiedAt()
        );
    }
}
