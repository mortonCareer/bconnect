package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.chat.Message;
import so.morton.api.storage.value.MessageType;

import java.time.LocalDateTime;
import java.util.List;

public record MessageResponse(
        Long id,
        Long chatId,
        Long memberId,
        MessageType type,
        String content,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static MessageResponse of(Message message) {
        return new MessageResponse(
                message.id(),
                message.chatId(),
                message.memberId(),
                message.type(),
                message.content(),
                message.createdAt(),
                message.modifiedAt()
        );
    }
    public static List<MessageResponse> of(List<Message> messages) {
        return messages.stream().map(MessageResponse::of).toList();
    }
}
