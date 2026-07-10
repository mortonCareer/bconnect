package to.bconnect.api.notification.domain.target;

import org.springframework.stereotype.Component;
import to.bconnect.api.notification.domain.NotificationType;
import to.bconnect.api.socket.message.ChatMessageSentEvent;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class ChatMessageTargetResolver implements NotificationTargetResolver<ChatMessageSentEvent> {

    @Override
    public NotificationType supports() {
        return NotificationType.CHAT_MESSAGE;
    }

    @Override
    public ResolvedNotification resolve(ChatMessageSentEvent event) {
        Set<Long> persist = new LinkedHashSet<>(event.recipientIds());
        Set<Long> push = event.recipientIds().stream()
                .filter(id -> !event.activeMemberIds().contains(id))
                .collect(Collectors.toCollection(LinkedHashSet::new));
        return new ResolvedNotification(
                event.senderId(), event.chatId(), event.preview(),
                new ResolvedNotification.Targets(persist, push));
    }
}
