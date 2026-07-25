package to.bconnect.api.notification.domain.target;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.socket.message.SocketMessageSentEvent;
import to.bconnect.api.storage.notification.NotificationArgs;
import to.bconnect.api.storage.notification.NotificationType;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class ChatMessageTargetResolver implements NotificationTargetResolver<SocketMessageSentEvent> {

    private final MemberResolver memberResolver;

    @Override
    public NotificationType supports() {
        return NotificationType.CHAT_MESSAGE;
    }

    @Override
    public ResolvedNotification resolve(SocketMessageSentEvent event) {
        Set<Long> receivers = event.inactiveIds();
        NotificationArgs args = receivers.isEmpty() || event.senderId() == null
                ? NotificationArgs.empty()
                : NotificationArgs.senderName(memberResolver.getOrWithdrawn(event.senderId()).name());
        return new ResolvedNotification(
                event.senderId(), event.chatId(), event.preview(), args,
                new ResolvedNotification.Targets(receivers, receivers));
    }
}
