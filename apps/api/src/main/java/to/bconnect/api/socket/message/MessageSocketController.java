package to.bconnect.api.socket.message;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import to.bconnect.api.core.domain.attachment.AttachmentResolver;
import to.bconnect.api.core.domain.attachment.ImageSize;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.presentation.v1.response.AttachmentResponse;
import to.bconnect.api.core.presentation.v1.response.MessageResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.chat.ChatType;

import java.util.Objects;

@Controller
@RequiredArgsConstructor
public class MessageSocketController {

    private final MessageSocketService messageSocketService;
    private final AttachmentResolver attachmentResolver;

    @MessageMapping("/group-chats/{chatId}/messages")
    @SendTo("/topic/group-chats/{chatId}")
    public MessageResponse sendGroup(
            @DestinationVariable Long chatId,
            @AuthenticationPrincipal AuthUser user,
            @Payload @Valid SendMessageRequest request) {
        return toResponse(messageSocketService.broadcast(user, chatId, ChatType.GROUP, request.toCommand()));
    }

    @MessageMapping("/direct-chats/{chatId}/messages")
    @SendTo("/topic/direct-chats/{chatId}")
    public MessageResponse sendDirect(
            @DestinationVariable Long chatId,
            @AuthenticationPrincipal AuthUser user,
            @Payload @Valid SendMessageRequest request) {
        return toResponse(messageSocketService.broadcast(user, chatId, ChatType.DIRECT, request.toCommand()));
    }

    private MessageResponse toResponse(Message message) {
        val attachmentMap = attachmentResolver.resolveMap(message.attachmentIds());
        val attachments = message.attachmentIds().stream()
                .map(attachmentMap::get)
                .filter(Objects::nonNull)
                .map(att -> AttachmentResponse.of(att, attachmentResolver.url(att, ImageSize.SMALL)))
                .toList();

        return MessageResponse.of(message, attachments);
    }
}
