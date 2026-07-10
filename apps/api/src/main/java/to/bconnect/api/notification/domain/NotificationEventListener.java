package to.bconnect.api.notification.domain;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import to.bconnect.api.socket.message.ChatMessageSentEvent;

@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onChatMessageSent(ChatMessageSentEvent event) {
        notificationService.handle(NotificationType.CHAT_MESSAGE, event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onMemberFirstDeviceRegistered(MemberFirstDeviceRegisteredEvent event) {
        notificationService.handle(NotificationType.SIGNUP_WELCOME, event);
        notificationService.handle(NotificationType.PROFILE_COMPLETION, event);
    }
}
