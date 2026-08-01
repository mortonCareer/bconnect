package to.bconnect.api.notification.domain;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import to.bconnect.api.core.domain.credential.CredentialReviewedEvent;
import to.bconnect.api.core.domain.member.MemberRegisteredEvent;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.domain.profile.ProfileCreatedEvent;
import to.bconnect.api.storage.credential.CredentialStatus;
import to.bconnect.api.security.session.NewDeviceLoginEvent;
import to.bconnect.api.socket.message.SocketMessageSentEvent;
import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationSenderType;
import to.bconnect.api.storage.notification.NotificationType;
import to.bconnect.api.storage.profile.ProfileRepository;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final MemberResolver memberResolver;
    private final ProfileRepository profileRepository;
    private final NotificationService notificationService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSocketMessageSent(SocketMessageSentEvent event) {
        val receivers = event.inactiveIds();
        if (receivers.isEmpty()) return;

        val message = event.message();
        val senderName = memberResolver.getOrWithdrawn(message.memberId()).name();

        notificationService.notify(receivers.stream()
                .map(receiverId -> new PushNotification(
                        receiverId,
                        NotificationType.CHAT_MESSAGE,
                        NotificationSenderType.MEMBER,
                        message.memberId(),
                        senderName,
                        NotificationReferenceType.CHAT_ROOM,
                        message.chatId(),
                        message.content()))
                .toList());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMemberRegistered(MemberRegisteredEvent event) {
        val notifications = new ArrayList<PushNotification>();

        val welcome = new PushNotification(
                event.memberId(),
                NotificationType.SIGNUP_WELCOME,
                null,
                null,
                null,
                null,
                null,
                null);
        notifications.add(welcome);

        if (!profileRepository.existsByMemberId(event.memberId())) {
            val profile = new PushNotification(
                    event.memberId(),
                    NotificationType.PROFILE_COMPLETION,
                    null,
                    null,
                    null,
                    NotificationReferenceType.PROFILE,
                    null,
                    null);
            notifications.add(profile);
        }

        notificationService.notify(notifications);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleProfileCreated(ProfileCreatedEvent event) {
        notificationService.notify(List.of(new PushNotification(
                event.memberId(),
                NotificationType.PROFILE_COMPLETED,
                null,
                null,
                null,
                NotificationReferenceType.PROFILE,
                null,
                null)));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCredentialReviewed(CredentialReviewedEvent event) {
        val type = event.status() == CredentialStatus.ACCEPTED
                ? NotificationType.CREDENTIAL_ACCEPTED
                : NotificationType.CREDENTIAL_DENIED;

        notificationService.notify(List.of(new PushNotification(
                event.memberId(),
                type,
                null,
                null,
                null,
                NotificationReferenceType.CREDENTIAL,
                event.credentialId(),
                null)));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleNewDeviceLogin(NewDeviceLoginEvent event) {
        notificationService.notify(List.of(new PushNotification(
                event.memberId(),
                NotificationType.NEW_DEVICE_LOGIN,
                null,
                null,
                null,
                null,
                null,
                null)));
    }
}
