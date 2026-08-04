package to.bconnect.api.notification.domain;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import to.bconnect.api.core.domain.company.CompanyService;
import to.bconnect.api.core.domain.coworker.CoworkerAcceptedEvent;
import to.bconnect.api.core.domain.coworker.CoworkerRequestedEvent;
import to.bconnect.api.core.domain.credential.CredentialReviewedEvent;
import to.bconnect.api.core.domain.member.MemberRegisteredEvent;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.domain.offer.OfferEvent;
import to.bconnect.api.core.domain.profile.ProfileCreatedEvent;
import to.bconnect.api.core.domain.recommendation.RecommendationWrittenEvent;
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
    private final CompanyService companyService;
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
    public void handleRecommendationWritten(RecommendationWrittenEvent event) {
        val senderName = memberResolver.getOrWithdrawn(event.fromId()).name();

        notificationService.notify(List.of(new PushNotification(
                event.toId(),
                NotificationType.RECOMMENDATION_WRITTEN,
                NotificationSenderType.MEMBER,
                event.fromId(),
                senderName,
                NotificationReferenceType.RECOMMENDATION,
                event.recommendationId(),
                null)));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCoworkerRequested(CoworkerRequestedEvent event) {
        val senderName = memberResolver.getOrWithdrawn(event.fromId()).name();

        notificationService.notify(List.of(new PushNotification(
                event.toId(),
                NotificationType.COWORKER_REQUESTED,
                NotificationSenderType.MEMBER,
                event.fromId(),
                senderName,
                NotificationReferenceType.COWORKER_REQUEST,
                event.requestId(),
                null)));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCoworkerAccepted(CoworkerAcceptedEvent event) {
        val senderName = memberResolver.getOrWithdrawn(event.toId()).name();

        notificationService.notify(List.of(new PushNotification(
                event.fromId(),
                NotificationType.COWORKER_ACCEPTED,
                NotificationSenderType.MEMBER,
                event.toId(),
                senderName,
                null,
                null,
                null)));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOfferEvent(OfferEvent event) {
        val notifications = new ArrayList<PushNotification>();

        switch (event.status()) {
            case ACTIVE -> {
                notifications.add(toWorker(NotificationType.OFFER_RECEIVED, event));
                notifications.add(toCompanyOwner(NotificationType.OFFER_SENT, event));
            }
            case ACCEPTED -> {
                notifications.add(toCompanyOwner(NotificationType.OFFER_ACCEPTED, event));
                notifications.add(toWorker(NotificationType.OFFER_ACCEPT_COMPLETED, event));
            }
            case DENIED -> notifications.add(toCompanyOwner(NotificationType.OFFER_DENIED, event));
            default -> { }
        }

        if (notifications.isEmpty()) return;
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
        val type = switch (event.status()) {
            case ACCEPTED -> NotificationType.CREDENTIAL_ACCEPTED;
            case DENIED -> NotificationType.CREDENTIAL_DENIED;
            default -> null;
        };
        if (type == null) return;

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
    public void handleDeviceRegistered(DeviceRegisteredEvent event) {
        notificationService.notify(List.of(new PushNotification(
                event.memberId(),
                NotificationType.DEVICE_REGISTERED,
                null,
                null,
                null,
                null,
                null,
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

    private PushNotification toWorker(NotificationType type, OfferEvent event) {
        val company = companyService.getOrWithdrawn(event.companyId());
        return new PushNotification(
                event.workerId(),
                type,
                NotificationSenderType.COMPANY,
                company.id(),
                company.name(),
                NotificationReferenceType.OFFER,
                event.offerId(),
                null);
    }

    private PushNotification toCompanyOwner(NotificationType type, OfferEvent event) {
        return new PushNotification(
                event.companyOwnerId(),
                type,
                NotificationSenderType.MEMBER,
                event.workerId(),
                memberResolver.getOrWithdrawn(event.workerId()).name(),
                NotificationReferenceType.OFFER,
                event.offerId(),
                null);
    }
}
