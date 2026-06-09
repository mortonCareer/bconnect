package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.storage.chat.MessageType;

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
