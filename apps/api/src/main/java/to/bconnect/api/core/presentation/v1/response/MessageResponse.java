package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.attachment.domain.Attachment;
import to.bconnect.api.attachment.presentation.v1.AttachmentResponse;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.storage.chat.ChatType;
import to.bconnect.api.storage.chat.MessageType;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record MessageResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long chatId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) ChatType chatType,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) MessageType type,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String content,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<AttachmentResponse> attachments
) {
    public static MessageResponse of(Message message) {
        return of(message, List.of(), Map.of());
    }

    public static MessageResponse of(Message message, List<Attachment> attachments, Map<Long, String> urls) {
        return new MessageResponse(
                message.id(),
                message.chatId(),
                message.chatType(),
                message.memberId(),
                message.type(),
                message.content(),
                message.createdAt(),
                message.modifiedAt(),
                AttachmentResponse.listOf(attachments, urls)
        );
    }
}
