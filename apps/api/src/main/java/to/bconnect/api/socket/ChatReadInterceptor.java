package to.bconnect.api.socket;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.jetbrains.annotations.NotNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import to.bconnect.api.socket.message.MessageService;
import to.bconnect.api.storage.chat.ChatType;

@Component
@RequiredArgsConstructor
public class ChatReadInterceptor implements ChannelInterceptor {

    private final MessageService messageService;

    @Override
    public Message<?> preSend(@NotNull Message<?> message, @NotNull MessageChannel channel) {
        val accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.SUBSCRIBE.equals(accessor.getCommand()))
            return message;

        val destination = accessor.getDestination();
        val user = accessor.getUser();
        if (destination == null || user == null)
            return message;

        if (destination.startsWith(WebSocketSecurityConfig.DIRECT_CHAT_TOPIC_PREFIX))
            markRead(user.getName(),
                    destination.substring(WebSocketSecurityConfig.DIRECT_CHAT_TOPIC_PREFIX.length()),
                    ChatType.DIRECT);
        else if (destination.startsWith(WebSocketSecurityConfig.GROUP_CHAT_TOPIC_PREFIX))
            markRead(user.getName(),
                    destination.substring(WebSocketSecurityConfig.GROUP_CHAT_TOPIC_PREFIX.length()),
                    ChatType.GROUP);

        return message;
    }

    private void markRead(String memberId, String chatId, ChatType chatType) {
        try {
            messageService.markReadLatest(Long.valueOf(chatId), chatType, Long.valueOf(memberId));
        } catch (NumberFormatException ignored) {
        }
    }
}
