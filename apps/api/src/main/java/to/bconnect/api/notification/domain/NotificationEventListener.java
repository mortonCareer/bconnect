package to.bconnect.api.notification.domain;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import to.bconnect.api.core.domain.company.CompanyFinder;
import to.bconnect.api.core.domain.company.CompanyService;
import to.bconnect.api.core.domain.coworker.CoworkerAcceptedEvent;
import to.bconnect.api.core.domain.coworker.CoworkerRequestedEvent;
import to.bconnect.api.core.domain.credential.CredentialReviewedEvent;
import to.bconnect.api.core.domain.member.MemberRegisteredEvent;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.domain.offer.OfferEvent;
import to.bconnect.api.core.domain.profile.ProfileCreatedEvent;
import to.bconnect.api.core.domain.recommendation.RecommendationWrittenEvent;
import to.bconnect.api.core.domain.task.TaskEvent;
import to.bconnect.api.security.session.NewDeviceLoginEvent;
import to.bconnect.api.socket.message.SocketMessageSentEvent;
import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationSenderType;
import to.bconnect.api.storage.notification.NotificationType;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final MemberResolver memberResolver;
    private final CompanyService companyService;
    private final CompanyFinder companyFinder;
    private final NotificationService notificationService;
    private final NotificationPushService notificationPushService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSocketMessageSent(SocketMessageSentEvent event) {
        val receivers = event.inactiveIds();
        if (receivers.isEmpty()) return;

        val message = event.message();
        val senderName = memberResolver.getOrWithdrawn(message.memberId()).name();

        val commands = receivers.stream()
                .map(receiverId -> new PushNotification(
                        null,
                        receiverId,
                        NotificationType.CHAT_MESSAGE,
                        NotificationSenderType.MEMBER,
                        message.memberId(),
                        senderName,
                        NotificationReferenceType.CHAT_ROOM,
                        message.chatId(),
                        message.content()))
                .toList();

        val created = notificationService.create(commands);
        notificationPushService.push(PushNotification.of(created, commands));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMemberRegistered(MemberRegisteredEvent event) {
        val welcome = new PushNotification(
                null,
                event.memberId(),
                NotificationType.SIGNUP_WELCOME,
                null,
                null,
                null,
                null,
                null,
                null);

        val commands = List.of(welcome);
        val created = notificationService.create(commands);
        notificationPushService.push(PushNotification.of(created, commands));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleRecommendationWritten(RecommendationWrittenEvent event) {
        val senderName = memberResolver.getOrWithdrawn(event.fromId()).name();

        val commands = List.of(new PushNotification(
                null,
                event.toId(),
                NotificationType.RECOMMENDATION_WRITTEN,
                NotificationSenderType.MEMBER,
                event.fromId(),
                senderName,
                NotificationReferenceType.RECOMMENDATION,
                event.recommendationId(),
                null));

        val created = notificationService.create(commands);
        notificationPushService.push(PushNotification.of(created, commands));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCoworkerRequested(CoworkerRequestedEvent event) {
        val senderName = memberResolver.getOrWithdrawn(event.fromId()).name();

        val commands = List.of(new PushNotification(
                null,
                event.toId(),
                NotificationType.COWORKER_REQUESTED,
                NotificationSenderType.MEMBER,
                event.fromId(),
                senderName,
                NotificationReferenceType.COWORKER_REQUEST,
                event.requestId(),
                null));

        val created = notificationService.create(commands);
        notificationPushService.push(PushNotification.of(created, commands));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCoworkerAccepted(CoworkerAcceptedEvent event) {
        val senderName = memberResolver.getOrWithdrawn(event.toId()).name();

        val commands = List.of(new PushNotification(
                null,
                event.fromId(),
                NotificationType.COWORKER_ACCEPTED,
                NotificationSenderType.MEMBER,
                event.toId(),
                senderName,
                null,
                null,
                null));

        val created = notificationService.create(commands);
        notificationPushService.push(PushNotification.of(created, commands));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOfferEvent(OfferEvent event) {
        val commands = new ArrayList<PushNotification>();

        switch (event.status()) {
            case ACTIVE -> {
                commands.add(toWorker(NotificationType.OFFER_RECEIVED, event));
                commands.add(toCompanyOwner(NotificationType.OFFER_SENT, event));
            }
            case ACCEPTED -> {
                commands.add(toCompanyOwner(NotificationType.OFFER_ACCEPTED, event));
                commands.add(toWorker(NotificationType.OFFER_ACCEPT_COMPLETED, event));
            }
            case DENIED -> commands.add(toCompanyOwner(NotificationType.OFFER_DENIED, event));
            default -> { }
        }

        if (commands.isEmpty()) return;

        val created = notificationService.create(commands);
        notificationPushService.push(PushNotification.of(created, commands));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskEvent(TaskEvent event) {
        val company = companyFinder.getByTaskId(event.taskId());

        val commands = List.of(new PushNotification(
                null,
                event.workerId(),
                NotificationType.TASK_UPDATED,
                NotificationSenderType.COMPANY,
                company.id(),
                company.name(),
                NotificationReferenceType.TASK,
                event.taskId(),
                null));

        val created = notificationService.create(commands);
        notificationPushService.push(PushNotification.of(created, commands));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleProfileCreated(ProfileCreatedEvent event) {
        val commands = List.of(new PushNotification(
                null,
                event.memberId(),
                NotificationType.PROFILE_COMPLETED,
                null,
                null,
                null,
                NotificationReferenceType.PROFILE,
                null,
                null));

        val created = notificationService.create(commands);
        notificationPushService.push(PushNotification.of(created, commands));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCredentialReviewed(CredentialReviewedEvent event) {
        val type = switch (event.status()) {
            case ACCEPTED -> NotificationType.CREDENTIAL_ACCEPTED;
            case DENIED -> NotificationType.CREDENTIAL_DENIED;
            default -> null;
        };
        if (type == null) return;

        val commands = List.of(new PushNotification(
                null,
                event.memberId(),
                type,
                null,
                null,
                null,
                NotificationReferenceType.CREDENTIAL,
                event.credentialId(),
                null));

        val created = notificationService.create(commands);
        notificationPushService.push(PushNotification.of(created, commands));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleDeviceRegistered(DeviceRegisteredEvent event) {
        val commands = List.of(new PushNotification(
                null,
                event.memberId(),
                NotificationType.DEVICE_REGISTERED,
                null,
                null,
                null,
                null,
                null,
                null));

        val created = notificationService.create(commands);
        notificationPushService.push(PushNotification.of(created, commands));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleNewDeviceLogin(NewDeviceLoginEvent event) {
        val commands = List.of(new PushNotification(
                null,
                event.memberId(),
                NotificationType.NEW_DEVICE_LOGIN,
                null,
                null,
                null,
                null,
                null,
                null));

        val created = notificationService.create(commands);
        notificationPushService.push(PushNotification.of(created, commands));
    }

    private PushNotification toWorker(NotificationType type, OfferEvent event) {
        val company = companyService.getOrWithdrawn(event.companyId());
        return new PushNotification(
                null,
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
                null,
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
