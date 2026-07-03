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
import to.bconnect.api.attachment.AttachmentResolver;
import to.bconnect.api.attachment.ImageSize;
import to.bconnect.api.attachment.AttachmentResponse;
import to.bconnect.api.core.presentation.v1.response.MessageResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.chat.ChatType;

/**
 * @see <a href="https://docs.spring.io/spring-framework/reference/web/websocket/stomp/handle-annotations.html">Annotated Controllers</a>
 */
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
        val message = messageSocketService.broadcast(user, chatId, ChatType.GROUP, request.toCommand());
        val attachments = attachmentResolver.list(ReferenceType.MESSAGE, message.id());
        val attachmentResponses = attachments.stream()
                .map(it -> AttachmentResponse.of(it, attachmentResolver.parseUrl(it, ImageSize.SMALL)))
                .toList();
        return MessageResponse.of(message, attachmentResponses);
    }

    @MessageMapping("/direct-chats/{chatId}/messages")
    @SendTo("/topic/direct-chats/{chatId}")
    public MessageResponse sendDirect(
            @DestinationVariable Long chatId,
            @AuthenticationPrincipal AuthUser user,
            @Payload @Valid SendMessageRequest request) {
        val message = messageSocketService.broadcast(user, chatId, ChatType.DIRECT, request.toCommand());
        val attachments = attachmentResolver.list(ReferenceType.MESSAGE, message.id());
        val attachmentResponses = attachments.stream()
                .map(it -> AttachmentResponse.of(it, attachmentResolver.parseUrl(it, ImageSize.SMALL)))
                .toList();
        return MessageResponse.of(message, attachmentResponses);
    }
}
