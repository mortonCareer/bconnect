package to.bconnect.api.ws.message;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import to.bconnect.api.domain.chat.MessageSocketService;
import to.bconnect.api.security.User;

@Controller
@RequiredArgsConstructor
public class MessageController {

    private final MessageSocketService messageSocketService;

    @MessageMapping("/chats/{chatId}/messages")
    @SendTo("/topic/chats/{chatId}")
    public void send(
            @DestinationVariable Long chatId,
            @AuthenticationPrincipal User user,
            @Payload @Valid SendMessageRequest request) {
        messageSocketService.broadcast(user, chatId, request);
    }
}
