package to.bconnect.api.socket.message;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;
import to.bconnect.api.attachment.domain.Attachment;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.presentation.v1.response.MessageResponse;
import to.bconnect.api.socket.WebSocketSecurityConfig;
import to.bconnect.api.storage.chat.ChatType;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * @see org.springframework.messaging.simp.user.SimpUserRegistry
 */
@Service
@RequiredArgsConstructor
public class MessageSocketManager {

    private final SimpMessagingTemplate messagingTemplate;
    private final SimpUserRegistry simpUserRegistry;

    public void send(Long chatId, ChatType chatType, Message message,
                     List<Attachment> attachments, Map<Long, String> urlMap) {
        val prefix = chatType == ChatType.DIRECT
                ? WebSocketSecurityConfig.DIRECT_CHAT_TOPIC_PREFIX
                : WebSocketSecurityConfig.GROUP_CHAT_TOPIC_PREFIX;

        val response = MessageResponse.of(message, attachments, urlMap);
        messagingTemplate.convertAndSend(prefix + chatId, response);
    }

    public Set<Long> resolveActiveIds(Long chatId, ChatType chatType) {
        val prefix = chatType == ChatType.DIRECT
                ? WebSocketSecurityConfig.DIRECT_CHAT_TOPIC_PREFIX
                : WebSocketSecurityConfig.GROUP_CHAT_TOPIC_PREFIX;
        val dest = prefix + chatId;

        return simpUserRegistry
                .findSubscriptions(it -> dest.equals(it.getDestination()))
                .stream()
                .map(it -> it.getSession().getUser().getName())
                .map(Long::valueOf)
                .collect(Collectors.toSet());
    }
}
