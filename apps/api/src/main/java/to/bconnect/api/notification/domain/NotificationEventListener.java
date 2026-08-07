package to.bconnect.api.notification.domain;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import to.bconnect.api.core.domain.chat.DirectChatService;
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
import to.bconnect.api.notification.domain.push.PushNotification;
import to.bconnect.api.security.session.NewDeviceLoginEvent;
import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationSenderType;
import to.bconnect.api.storage.notification.NotificationType;

import java.util.List;

@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final MemberResolver memberResolver;
    private final CompanyService companyService;
    private final CompanyFinder companyFinder;
    private final DirectChatService directChatService;
    private final NotificationService notificationService;
    private final NotificationPushService notificationPushService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMemberRegistered(MemberRegisteredEvent event) {
        val createCommands = List.of(new CreateNotification(
                event.memberId(),
                NotificationType.SIGNUP_WELCOME,
                null,
                null,
                null,
                null));
        val domains = notificationService.create(createCommands);

        val pushCommands = domains.stream()
                .map(it -> new PushNotification(
                        it.id(),
                        it.memberId(),
                        it.type(),
                        null,
                        it.referenceType(),
                        it.referenceId(),
                        null))
                .toList();
        notificationPushService.push(pushCommands);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleRecommendationWritten(RecommendationWrittenEvent event) {
        val createCommands = List.of(new CreateNotification(
                event.toId(),
                NotificationType.RECOMMENDATION_WRITTEN,
                NotificationSenderType.MEMBER,
                event.fromId(),
                NotificationReferenceType.RECOMMENDATION,
                event.recommendationId()));
        val domains = notificationService.create(createCommands);

        val senderName = memberResolver.getOrWithdrawn(event.fromId()).name();
        val pushCommands = domains.stream()
                .map(it -> new PushNotification(
                        it.id(),
                        it.memberId(),
                        it.type(),
                        senderName,
                        it.referenceType(),
                        it.referenceId(),
                        null))
                .toList();
        notificationPushService.push(pushCommands);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCoworkerRequested(CoworkerRequestedEvent event) {
        val createCommands = List.of(new CreateNotification(
                event.toId(),
                NotificationType.COWORKER_REQUESTED,
                NotificationSenderType.MEMBER,
                event.fromId(),
                NotificationReferenceType.COWORKER_REQUEST,
                event.requestId()));
        val domains = notificationService.create(createCommands);

        val senderName = memberResolver.getOrWithdrawn(event.fromId()).name();
        val pushCommands = domains.stream()
                .map(it -> new PushNotification(
                        it.id(),
                        it.memberId(),
                        it.type(),
                        senderName,
                        it.referenceType(),
                        it.referenceId(),
                        null))
                .toList();
        notificationPushService.push(pushCommands);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCoworkerAccepted(CoworkerAcceptedEvent event) {
        val createCommands = List.of(new CreateNotification(
                event.fromId(),
                NotificationType.COWORKER_ACCEPTED,
                NotificationSenderType.MEMBER,
                event.toId(),
                null,
                null));
        val domains = notificationService.create(createCommands);

        val senderName = memberResolver.getOrWithdrawn(event.toId()).name();
        val pushCommands = domains.stream()
                .map(it -> new PushNotification(
                        it.id(),
                        it.memberId(),
                        it.type(),
                        senderName,
                        it.referenceType(),
                        it.referenceId(),
                        null))
                .toList();
        notificationPushService.push(pushCommands);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOfferEvent(OfferEvent event) {
        val chatId = directChatService.getOrCreate(event.companyOwnerId(), event.workerId());
        val createCommands = switch (event.status()) {
            case ACTIVE -> List.of(
                    new CreateNotification(event.workerId(), NotificationType.OFFER_RECEIVED,
                            NotificationSenderType.COMPANY, event.companyId(),
                            NotificationReferenceType.CHAT_ROOM, chatId),
                    new CreateNotification(event.companyOwnerId(), NotificationType.OFFER_SENT,
                            NotificationSenderType.MEMBER, event.workerId(),
                            NotificationReferenceType.CHAT_ROOM, chatId));
            case ACCEPTED -> List.of(
                    new CreateNotification(event.companyOwnerId(), NotificationType.OFFER_ACCEPTED,
                            NotificationSenderType.MEMBER, event.workerId(),
                            NotificationReferenceType.CHAT_ROOM, chatId),
                    new CreateNotification(event.workerId(), NotificationType.OFFER_ACCEPT_COMPLETED,
                            NotificationSenderType.COMPANY, event.companyId(),
                            NotificationReferenceType.CHAT_ROOM, chatId));
            case DENIED -> List.of(
                    new CreateNotification(event.companyOwnerId(), NotificationType.OFFER_DENIED,
                            NotificationSenderType.MEMBER, event.workerId(),
                            NotificationReferenceType.CHAT_ROOM, chatId));
            default -> List.<CreateNotification>of();
        };
        val domains = notificationService.create(createCommands);
        if (domains.isEmpty()) return;

        val company = companyService.getOrWithdrawn(event.companyId());
        val workerName = memberResolver.getOrWithdrawn(event.workerId()).name();

        val pushCommands = domains.stream()
                .map(it -> new PushNotification(
                        it.id(),
                        it.memberId(),
                        it.type(),
                        it.senderType() == NotificationSenderType.COMPANY ? company.name() : workerName,
                        it.referenceType(),
                        it.referenceId(),
                        null))
                .toList();
        notificationPushService.push(pushCommands);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskEvent(TaskEvent event) {
        val company = companyFinder.getByTaskId(event.taskId());
        val createCommands = List.of(new CreateNotification(
                event.workerId(),
                NotificationType.TASK_UPDATED,
                NotificationSenderType.COMPANY,
                company.id(),
                NotificationReferenceType.TASK,
                event.taskId()));
        val domains = notificationService.create(createCommands);

        val pushCommands = domains.stream()
                .map(it -> new PushNotification(
                        it.id(),
                        it.memberId(),
                        it.type(),
                        company.name(),
                        it.referenceType(),
                        it.referenceId(),
                        null))
                .toList();
        notificationPushService.push(pushCommands);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleProfileCreated(ProfileCreatedEvent event) {
        val createCommands = List.of(new CreateNotification(
                event.memberId(),
                NotificationType.PROFILE_COMPLETED,
                null,
                null,
                NotificationReferenceType.PROFILE,
                null));
        val domains = notificationService.create(createCommands);

        val pushCommands = domains.stream()
                .map(it -> new PushNotification(
                        it.id(),
                        it.memberId(),
                        it.type(),
                        null,
                        it.referenceType(),
                        it.referenceId(),
                        null))
                .toList();
        notificationPushService.push(pushCommands);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCredentialReviewed(CredentialReviewedEvent event) {
        val type = switch (event.status()) {
            case ACCEPTED -> NotificationType.CREDENTIAL_ACCEPTED;
            case DENIED -> NotificationType.CREDENTIAL_DENIED;
            default -> null;
        };
        if (type == null) return;

        val createCommands = List.of(new CreateNotification(
                event.memberId(),
                type,
                null,
                null,
                NotificationReferenceType.CREDENTIAL,
                event.credentialId()));
        val domains = notificationService.create(createCommands);

        val pushCommands = domains.stream()
                .map(it -> new PushNotification(
                        it.id(),
                        it.memberId(),
                        it.type(),
                        null,
                        it.referenceType(),
                        it.referenceId(),
                        null))
                .toList();
        notificationPushService.push(pushCommands);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleDeviceRegistered(DeviceRegisteredEvent event) {
        val createCommands = List.of(new CreateNotification(
                event.memberId(),
                NotificationType.DEVICE_REGISTERED,
                null,
                null,
                null,
                null));
        val domains = notificationService.create(createCommands);

        val pushCommands = domains.stream()
                .map(it -> new PushNotification(
                        it.id(),
                        it.memberId(),
                        it.type(),
                        null,
                        it.referenceType(),
                        it.referenceId(),
                        null))
                .toList();
        notificationPushService.push(pushCommands);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleNewDeviceLogin(NewDeviceLoginEvent event) {
        val createCommands = List.of(new CreateNotification(
                event.memberId(),
                NotificationType.NEW_DEVICE_LOGIN,
                null,
                null,
                null,
                null));
        val domains = notificationService.create(createCommands);

        val pushCommands = domains.stream()
                .map(it -> new PushNotification(
                        it.id(),
                        it.memberId(),
                        it.type(),
                        null,
                        it.referenceType(),
                        it.referenceId(),
                        null))
                .toList();
        notificationPushService.push(pushCommands);
    }
}
