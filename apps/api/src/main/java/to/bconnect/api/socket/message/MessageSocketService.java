package to.bconnect.api.socket.message;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.core.domain.chat.GroupChatService;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.domain.chat.SendMessage;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.socket.WebSocketSecurityConfig;
import to.bconnect.api.storage.chat.ChatType;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * @see org.springframework.messaging.simp.user.SimpUserRegistry
 */
@Service
@RequiredArgsConstructor
public class MessageSocketService {

    private final MessageService messageService;
    private final GroupChatService groupChatService;
    private final SimpUserRegistry simpUserRegistry;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Message broadcast(AuthUser user, Long chatId, ChatType chatType, SendMessage command) {
        val message = messageService.create(chatId, chatType, user.id(), command);
        val activeIds = findActiveMemberIds(chatId, chatType);
        val participantIds = groupChatService.findParticipantIds(chatId, chatType);
        val inactiveIds = new HashSet<>(participantIds);
        inactiveIds.removeAll(activeIds);

        messageService.markRead(chatId, chatType, activeIds, message.id());
        eventPublisher.publishEvent(new SocketMessageSentEvent(
                activeIds, inactiveIds, message));
        return message;
    }

    private Set<Long> findActiveMemberIds(Long chatId, ChatType chatType) {
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
