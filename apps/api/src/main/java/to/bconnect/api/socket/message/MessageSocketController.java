package to.bconnect.api.socket.message;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.chat.ChatType;


/**
 * @see <a href="https://docs.spring.io/spring-framework/reference/web/websocket/stomp/handle-annotations.html">Annotated Controllers</a>
 */
@Controller
@RequiredArgsConstructor
public class MessageSocketController {

    private final MessageSocketService messageSocketService;

    @MessageMapping("/group-chats/{chatId}/messages")
    public void sendGroup(
            @DestinationVariable Long chatId,
            @AuthenticationPrincipal AuthUser user,
            @Payload @Valid SendMessageRequest request) {
        messageSocketService.broadcast(chatId, ChatType.GROUP, user.id(), request.toCommand());
    }

    @MessageMapping("/direct-chats/{chatId}/messages")
    public void sendDirect(
            @DestinationVariable Long chatId,
            @AuthenticationPrincipal AuthUser user,
            @Payload @Valid SendMessageRequest request) {
        messageSocketService.broadcast(chatId, ChatType.DIRECT, user.id(), request.toCommand());
    }
}
