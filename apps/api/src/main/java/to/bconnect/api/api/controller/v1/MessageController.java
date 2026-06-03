package to.bconnect.api.api.controller.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import to.bconnect.api.api.controller.v1.request.SendMessageRequest;
import to.bconnect.api.api.controller.v1.response.MessageResponse;
import to.bconnect.api.domain.chat.Message;
import to.bconnect.api.domain.chat.MessageService;
import to.bconnect.api.support.security.User;

@Controller
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @MessageMapping("/chats/{chatId}/messages")
    @SendTo("/topic/chats/{chatId}")
    public MessageResponse send(
            @DestinationVariable Long chatId,
            @AuthenticationPrincipal User user,
            @Payload @Valid SendMessageRequest request) {
        Message message = messageService.broadcast(user, chatId, request);
        return MessageResponse.of(message);
    }
}
