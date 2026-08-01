package to.bconnect.api.notification.domain;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.core.domain.credential.CredentialReviewedEvent;
import to.bconnect.api.core.domain.offer.OfferEvent;
import to.bconnect.api.core.domain.profile.ProfileCreatedEvent;
import to.bconnect.api.security.session.NewDeviceLoginEvent;
import to.bconnect.api.storage.credential.CredentialStatus;
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationRepository;
import to.bconnect.api.storage.notification.NotificationSenderType;
import to.bconnect.api.storage.notification.NotificationType;
import to.bconnect.api.storage.offer.OfferStatus;
import to.bconnect.api.support.IntegrationTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
class NotificationEventListenerTest {

    private static final Long SEED_WORKER_ID = 101L;
    private static final Long SEED_COMPANY_OWNER_ID = 200L;
    private static final Long SEED_COMPANY_ID = 200L;
    private static final Long OWNERLESS_MEMBER_ID = 104L;

    @Autowired private NotificationEventListener notificationEventListener;
    @Autowired private NotificationRepository notificationRepository;

    @Test
    @DisplayName("handleNewDeviceLogin - 새 기기 로그인 이벤트를 받으면 시스템 알림이 저장된다")
    void handleNewDeviceLogin_success() {
        // given
        val memberId = 101L;

        // when
        notificationEventListener.handleNewDeviceLogin(new NewDeviceLoginEvent(memberId, "01000000003"));

        // then
        val found = notificationRepository.findAllByMemberId(memberId).stream()
                .filter(it -> it.getType() == NotificationType.NEW_DEVICE_LOGIN)
                .toList();
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getSenderType()).isNull();
        assertThat(found.getFirst().getSenderId()).isNull();
        assertThat(found.getFirst().getReferenceType()).isNull();
        assertThat(found.getFirst().getReferenceId()).isNull();
    }

    @Test
    @DisplayName("handleOfferEvent - ACTIVE 이벤트를 받으면 기술자와 업체 대표에게 알림이 저장된다")
    void handleOfferEvent_active() {
        // given
        val offerId = 501L;

        // when
        notificationEventListener.handleOfferEvent(
                new OfferEvent(offerId, SEED_WORKER_ID, SEED_COMPANY_OWNER_ID, OfferStatus.ACTIVE));

        // then
        val received = findByTypeAndReference(SEED_WORKER_ID, NotificationType.OFFER_RECEIVED, offerId);
        assertThat(received).hasSize(1);
        assertThat(received.getFirst().getSenderType()).isEqualTo(NotificationSenderType.COMPANY);
        assertThat(received.getFirst().getSenderId()).isEqualTo(SEED_COMPANY_ID);

        val sent = findByTypeAndReference(SEED_COMPANY_OWNER_ID, NotificationType.OFFER_SENT, offerId);
        assertThat(sent).hasSize(1);
        assertThat(sent.getFirst().getSenderType()).isEqualTo(NotificationSenderType.MEMBER);
        assertThat(sent.getFirst().getSenderId()).isEqualTo(SEED_WORKER_ID);
    }

    @Test
    @DisplayName("handleOfferEvent - ACCEPTED 이벤트를 받으면 업체 대표와 기술자에게 알림이 저장된다")
    void handleOfferEvent_accepted() {
        // given
        val offerId = 502L;

        // when
        notificationEventListener.handleOfferEvent(
                new OfferEvent(offerId, SEED_WORKER_ID, SEED_COMPANY_OWNER_ID, OfferStatus.ACCEPTED));

        // then
        assertThat(findByTypeAndReference(SEED_COMPANY_OWNER_ID, NotificationType.OFFER_ACCEPTED, offerId)).hasSize(1);
        assertThat(findByTypeAndReference(SEED_WORKER_ID, NotificationType.OFFER_ACCEPT_COMPLETED, offerId)).hasSize(1);
    }

    @Test
    @DisplayName("handleOfferEvent - DENIED 이벤트를 받으면 업체 대표에게만 알림이 저장된다")
    void handleOfferEvent_denied() {
        // given
        val offerId = 503L;

        // when
        notificationEventListener.handleOfferEvent(
                new OfferEvent(offerId, SEED_WORKER_ID, SEED_COMPANY_OWNER_ID, OfferStatus.DENIED));

        // then
        assertThat(findByTypeAndReference(SEED_COMPANY_OWNER_ID, NotificationType.OFFER_DENIED, offerId)).hasSize(1);
        val workerNotifications = notificationRepository.findAllByMemberId(SEED_WORKER_ID).stream()
                .filter(it -> it.getReferenceId() != null && it.getReferenceId().equals(offerId))
                .toList();
        assertThat(workerNotifications).isEmpty();
    }

    @Test
    @DisplayName("handleOfferEvent - EXPIRED 이벤트를 받으면 알림이 저장되지 않는다")
    void handleOfferEvent_expired() {
        // given
        val offerId = 504L;

        // when
        notificationEventListener.handleOfferEvent(
                new OfferEvent(offerId, SEED_WORKER_ID, SEED_COMPANY_OWNER_ID, OfferStatus.EXPIRED));

        // then
        val all = notificationRepository.findAll().stream()
                .filter(it -> it.getReferenceId() != null && it.getReferenceId().equals(offerId))
                .toList();
        assertThat(all).isEmpty();
    }

    @Test
    @DisplayName("handleOfferEvent - 업체가 없는 대표일 때 ACTIVE 이벤트를 받으면 기술자 알림은 스킵된다")
    void handleOfferEvent_active_companyNotFound() {
        // given
        val offerId = 505L;

        // when
        notificationEventListener.handleOfferEvent(
                new OfferEvent(offerId, SEED_WORKER_ID, OWNERLESS_MEMBER_ID, OfferStatus.ACTIVE));

        // then
        assertThat(findByTypeAndReference(SEED_WORKER_ID, NotificationType.OFFER_RECEIVED, offerId)).isEmpty();
        assertThat(findByTypeAndReference(OWNERLESS_MEMBER_ID, NotificationType.OFFER_SENT, offerId)).hasSize(1);
    }

    private List<NotificationEntity> findByTypeAndReference(Long memberId, NotificationType type, Long referenceId) {
        return notificationRepository.findAllByMemberId(memberId).stream()
                .filter(it -> it.getType() == type)
                .filter(it -> referenceId.equals(it.getReferenceId()))
                .toList();
    }

    @Test
    @DisplayName("handleProfileCreated - 프로필 생성 이벤트를 받으면 프로필 완성 알림이 저장된다")
    void handleProfileCreated_success() {
        // given
        val memberId = 103L;

        // when
        notificationEventListener.handleProfileCreated(new ProfileCreatedEvent(memberId, 100L));

        // then
        val found = notificationRepository.findAllByMemberId(memberId).stream()
                .filter(it -> it.getType() == NotificationType.PROFILE_COMPLETED)
                .toList();
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getSenderType()).isNull();
        assertThat(found.getFirst().getReferenceType()).isEqualTo(NotificationReferenceType.PROFILE);
        assertThat(found.getFirst().getReferenceId()).isNull();
    }

    @Test
    @DisplayName("handleCredentialReviewed - 승인 이벤트를 받으면 승인 알림이 저장된다")
    void handleCredentialReviewed_accepted() {
        // given
        val memberId = 102L;
        val credentialId = 100L;

        // when
        notificationEventListener.handleCredentialReviewed(
                new CredentialReviewedEvent(credentialId, memberId, CredentialStatus.ACCEPTED));

        // then
        val found = notificationRepository.findAllByMemberId(memberId).stream()
                .filter(it -> it.getType() == NotificationType.CREDENTIAL_ACCEPTED)
                .toList();
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getSenderType()).isNull();
        assertThat(found.getFirst().getReferenceType()).isEqualTo(NotificationReferenceType.CREDENTIAL);
        assertThat(found.getFirst().getReferenceId()).isEqualTo(credentialId);
    }

    @Test
    @DisplayName("handleCredentialReviewed - 반려 이벤트를 받으면 반려 알림이 저장된다")
    void handleCredentialReviewed_denied() {
        // given
        val memberId = 102L;
        val credentialId = 101L;

        // when
        notificationEventListener.handleCredentialReviewed(
                new CredentialReviewedEvent(credentialId, memberId, CredentialStatus.DENIED));

        // then
        val found = notificationRepository.findAllByMemberId(memberId).stream()
                .filter(it -> it.getType() == NotificationType.CREDENTIAL_DENIED)
                .toList();
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getReferenceType()).isEqualTo(NotificationReferenceType.CREDENTIAL);
        assertThat(found.getFirst().getReferenceId()).isEqualTo(credentialId);
    }
}
