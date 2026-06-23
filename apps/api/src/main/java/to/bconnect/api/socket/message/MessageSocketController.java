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
import to.bconnect.api.core.presentation.v1.response.AttachmentResponse;
import to.bconnect.api.core.presentation.v1.response.MessageResponse;
import to.bconnect.api.security.AuthUser;

import java.util.Objects;

@Controller
@RequiredArgsConstructor
public class MessageSocketController {

    private final MessageSocketService messageSocketService;
    private final AttachmentResolver attachmentResolver;

    @MessageMapping("/chats/{chatId}/messages")
    @SendTo("/topic/chats/{chatId}")
    public MessageResponse send(
            @DestinationVariable Long chatId,
            @AuthenticationPrincipal AuthUser user,
            @Payload @Valid SendMessageRequest request) {
        val message = messageSocketService.broadcast(user, chatId, request.toCommand());

        val attachmentMap = attachmentResolver.resolveMap(message.attachmentIds());
        val attachments = message.attachmentIds().stream()
                .map(attachmentMap::get)
                .filter(Objects::nonNull)
                .map(att -> AttachmentResponse.of(att, attachmentResolver.url(att, ImageSize.SMALL)))
                .toList();

        return MessageResponse.of(message, attachments);
    }
}
