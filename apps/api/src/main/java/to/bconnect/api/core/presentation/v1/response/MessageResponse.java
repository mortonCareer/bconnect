package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.attachment.domain.Attachment;
import to.bconnect.api.attachment.presentation.v1.AttachmentResponse;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.storage.chat.MessageType;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record MessageResponse(
        Long id,
        Long chatId,
        Long memberId,
        MessageType type,
        String content,
        Instant createdAt,
        Instant modifiedAt,
        List<AttachmentResponse> attachments
) {
    public static MessageResponse of(Message message) {
        return of(message, List.of(), Map.of());
    }

    public static MessageResponse of(Message message, List<Attachment> attachments, Map<Long, String> urlMap) {
        return new MessageResponse(
                message.id(),
                message.chatId(),
                message.memberId(),
                message.type(),
                message.content(),
                message.createdAt(),
                message.modifiedAt(),
                attachments.stream()
                        .map(it -> AttachmentResponse.of(it, urlMap.get(it.id())))
                        .toList()
        );
    }
}
