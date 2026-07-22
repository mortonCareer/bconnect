package to.bconnect.api.notification.domain.target;

import org.springframework.stereotype.Component;
import to.bconnect.api.notification.domain.NotificationType;
import to.bconnect.api.socket.message.SocketMessageSentEvent;

import java.util.LinkedHashSet;
import java.util.Set;

@Component
public class ChatMessageTargetResolver implements NotificationTargetResolver<SocketMessageSentEvent> {

    @Override
    public NotificationType supports() {
        return NotificationType.CHAT_MESSAGE;
    }

    @Override
    public ResolvedNotification resolve(SocketMessageSentEvent event) {
        Set<Long> receivers = event.inactiveIds();
        return new ResolvedNotification(
                event.senderId(), event.chatId(), event.preview(),
                new ResolvedNotification.Targets(receivers, new LinkedHashSet<>(receivers)));
    }
}
