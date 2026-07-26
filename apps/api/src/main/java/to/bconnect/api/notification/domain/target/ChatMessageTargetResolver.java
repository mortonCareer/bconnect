package to.bconnect.api.notification.domain.target;

import org.springframework.stereotype.Component;
import to.bconnect.api.core.domain.chat.Message;
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
                event.message().memberId(), event.message().chatId(), preview(event.message()),
                new ResolvedNotification.Targets(receivers, new LinkedHashSet<>(receivers)));
    }

    private static String preview(Message message) {
        return switch (message.type()) {
            case IMAGE -> "사진을 보냈습니다";
            case FILE -> "파일을 보냈습니다";
            default -> message.content();
        };
    }
}
