package to.bconnect.api.notification.domain;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.transaction.TestTransaction;
import to.bconnect.api.core.domain.coworker.CoworkerAcceptedEvent;
import to.bconnect.api.core.domain.coworker.CoworkerRequestedEvent;
import to.bconnect.api.core.domain.credential.CredentialReviewedEvent;
import to.bconnect.api.core.domain.offer.OfferEvent;
import to.bconnect.api.core.domain.profile.ProfileCreatedEvent;
import to.bconnect.api.core.domain.recommendation.RecommendationWrittenEvent;
import to.bconnect.api.core.domain.task.TaskEvent;
import to.bconnect.api.security.session.NewDeviceLoginEvent;
import to.bconnect.api.storage.chat.DirectChatRepository;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.credential.CredentialStatus;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationRepository;
import to.bconnect.api.storage.notification.NotificationType;
import to.bconnect.api.storage.offer.OfferStatus;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.CompanyFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.ProjectFactory;
import to.bconnect.api.support.fixture.TaskFactory;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
class NotificationEventListenerTest {

    private static final Long MISSING_COMPANY_ID = 999_999L;

    @Autowired private NotificationEventListener notificationEventListener;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private TaskRepository taskRepository;
    @Autowired private DirectChatRepository directChatRepository;

    @Test
    @DisplayName("handleNewDeviceLogin - 새 기기 로그인 이벤트를 받으면 시스템 알림이 저장된다")
    void handleNewDeviceLogin_success() {
        // given
        val member = saveMember("noti-login1", "01000009101");
        commitGiven();
        val event = new NewDeviceLoginEvent(member.getId(), member.getPhone());

        // when
        notificationEventListener.handleNewDeviceLogin(event);

        // then
        assertThat(findByType(member.getId(), NotificationType.NEW_DEVICE_LOGIN)).hasSize(1);
    }

    @Test
    @DisplayName("handleCredentialReviewed - 승인 이벤트를 받으면 승인 알림이 저장된다")
    void handleCredentialReviewed_accepted() {
        // given
        val member = saveMember("noti-cred1", "01000009201");
        commitGiven();
        val credentialId = 100L;
        val event = new CredentialReviewedEvent(credentialId, member.getId(), CredentialStatus.ACCEPTED);

        // when
        notificationEventListener.handleCredentialReviewed(event);

        // then
        val found = findByType(member.getId(), NotificationType.CREDENTIAL_ACCEPTED);
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getReferenceId()).isEqualTo(credentialId);
    }

    @Test
    @DisplayName("handleCredentialReviewed - 반려 이벤트를 받으면 반려 알림이 저장된다")
    void handleCredentialReviewed_denied() {
        // given
        val member = saveMember("noti-cred2", "01000009202");
        commitGiven();
        val credentialId = 101L;
        val event = new CredentialReviewedEvent(credentialId, member.getId(), CredentialStatus.DENIED);

        // when
        notificationEventListener.handleCredentialReviewed(event);

        // then
        val found = findByType(member.getId(), NotificationType.CREDENTIAL_DENIED);
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getReferenceId()).isEqualTo(credentialId);
    }

    @Test
    @DisplayName("handleProfileCreated - 프로필 생성 이벤트를 받으면 프로필 완성 알림이 저장된다")
    void handleProfileCreated_success() {
        // given
        val member = saveMember("noti-profile1", "01000009301");
        commitGiven();
        val event = new ProfileCreatedEvent(member.getId(), 100L);

        // when
        notificationEventListener.handleProfileCreated(event);

        // then
        assertThat(findByType(member.getId(), NotificationType.PROFILE_COMPLETED)).hasSize(1);
    }

    @Test
    @DisplayName("handleOfferEvent - ACTIVE 이벤트를 받으면 기술자와 업체 대표에게 알림이 저장된다")
    void handleOfferEvent_active() {
        // given
        val worker = saveMember("noti-offer1a", "01000009401");
        val owner = saveMember("noti-offer1b", "01000009402");
        val company = companyRepository.save(CompanyFactory.entity(owner.getId(), "9000009401"));
        commitGiven();
        val event = new OfferEvent(100L, worker.getId(), company.getId(), owner.getId(), OfferStatus.ACTIVE);

        // when
        notificationEventListener.handleOfferEvent(event);

        // then
        val chat = directChatRepository.findByMembers(owner.getId(), worker.getId()).orElseThrow();
        val received = findByType(worker.getId(), NotificationType.OFFER_RECEIVED);
        assertThat(received).hasSize(1);
        assertThat(received.getFirst().getSenderId()).isEqualTo(company.getId());
        assertThat(received.getFirst().getReferenceType()).isEqualTo(NotificationReferenceType.CHAT_ROOM);
        assertThat(received.getFirst().getReferenceId()).isEqualTo(chat.getId());

        val sent = findByType(owner.getId(), NotificationType.OFFER_SENT);
        assertThat(sent).hasSize(1);
        assertThat(sent.getFirst().getSenderId()).isEqualTo(worker.getId());
    }

    @Test
    @DisplayName("handleOfferEvent - ACCEPTED 이벤트를 받으면 업체 대표와 기술자에게 알림이 저장된다")
    void handleOfferEvent_accepted() {
        // given
        val worker = saveMember("noti-offer2a", "01000009403");
        val owner = saveMember("noti-offer2b", "01000009404");
        val company = companyRepository.save(CompanyFactory.entity(owner.getId(), "9000009402"));
        commitGiven();
        val event = new OfferEvent(100L, worker.getId(), company.getId(), owner.getId(), OfferStatus.ACCEPTED);

        // when
        notificationEventListener.handleOfferEvent(event);

        // then
        assertThat(findByType(owner.getId(), NotificationType.OFFER_ACCEPTED)).hasSize(1);
        assertThat(findByType(worker.getId(), NotificationType.OFFER_ACCEPT_COMPLETED)).hasSize(1);
    }

    @Test
    @DisplayName("handleOfferEvent - DENIED 이벤트를 받으면 업체 대표에게 알림이 저장된다")
    void handleOfferEvent_denied() {
        // given
        val worker = saveMember("noti-offer3a", "01000009405");
        val owner = saveMember("noti-offer3b", "01000009406");
        val company = companyRepository.save(CompanyFactory.entity(owner.getId(), "9000009403"));
        commitGiven();
        val event = new OfferEvent(100L, worker.getId(), company.getId(), owner.getId(), OfferStatus.DENIED);

        // when
        notificationEventListener.handleOfferEvent(event);

        // then
        val denied = findByType(owner.getId(), NotificationType.OFFER_DENIED);
        assertThat(denied).hasSize(1);
        assertThat(denied.getFirst().getSenderId()).isEqualTo(worker.getId());
    }

    @Test
    @DisplayName("handleOfferEvent - 업체가 삭제되었을 때 ACTIVE 이벤트를 받으면 기술자 알림이 삭제된 업체 발신으로 저장된다")
    void handleOfferEvent_active_companyWithdrawn() {
        // given
        val worker = saveMember("noti-offer4a", "01000009407");
        val owner = saveMember("noti-offer4b", "01000009408");
        commitGiven();
        val event = new OfferEvent(100L, worker.getId(), MISSING_COMPANY_ID, owner.getId(), OfferStatus.ACTIVE);

        // when
        notificationEventListener.handleOfferEvent(event);

        // then
        val received = findByType(worker.getId(), NotificationType.OFFER_RECEIVED);
        assertThat(received).hasSize(1);
        assertThat(received.getFirst().getSenderId()).isEqualTo(MISSING_COMPANY_ID);
    }

    @Test
    @DisplayName("handleTaskEvent - 작업 변경 이벤트를 받으면 기술자에게 알림이 저장된다")
    void handleTaskEvent_success() {
        // given
        val worker = saveMember("noti-task1a", "01000009801");
        val owner = saveMember("noti-task1b", "01000009802");
        val company = companyRepository.save(CompanyFactory.entity(owner.getId(), "9000009801"));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(TaskFactory.projectEntity(project.getId(), worker.getId()));
        commitGiven();
        val event = new TaskEvent(task.getId(), worker.getId(), owner.getId());

        // when
        notificationEventListener.handleTaskEvent(event);

        // then
        val found = findByType(worker.getId(), NotificationType.TASK_UPDATED);
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getSenderId()).isEqualTo(company.getId());
        assertThat(found.getFirst().getReferenceId()).isEqualTo(task.getId());
    }

    @Test
    @DisplayName("handleCoworkerRequested - 동료 요청 이벤트를 받으면 대상자에게 알림이 저장된다")
    void handleCoworkerRequested_success() {
        // given
        val from = saveMember("noti-cw1a", "01000009501");
        val to = saveMember("noti-cw1b", "01000009502");
        commitGiven();
        val requestId = 100L;
        val event = new CoworkerRequestedEvent(requestId, from.getId(), to.getId());

        // when
        notificationEventListener.handleCoworkerRequested(event);

        // then
        val found = findByType(to.getId(), NotificationType.COWORKER_REQUESTED);
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getSenderId()).isEqualTo(from.getId());
        assertThat(found.getFirst().getReferenceId()).isEqualTo(requestId);
    }

    @Test
    @DisplayName("handleCoworkerAccepted - 동료 수락 이벤트를 받으면 요청자에게 알림이 저장된다")
    void handleCoworkerAccepted_success() {
        // given
        val from = saveMember("noti-cw2a", "01000009503");
        val to = saveMember("noti-cw2b", "01000009504");
        commitGiven();
        val event = new CoworkerAcceptedEvent(from.getId(), to.getId());

        // when
        notificationEventListener.handleCoworkerAccepted(event);

        // then
        val found = findByType(from.getId(), NotificationType.COWORKER_ACCEPTED);
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getSenderId()).isEqualTo(to.getId());
    }

    @Test
    @DisplayName("handleRecommendationWritten - 추천서 작성 이벤트를 받으면 수신자에게 알림이 저장된다")
    void handleRecommendationWritten_success() {
        // given
        val from = saveMember("noti-reco1a", "01000009601");
        val to = saveMember("noti-reco1b", "01000009602");
        commitGiven();
        val recommendationId = 100L;
        val event = new RecommendationWrittenEvent(recommendationId, from.getId(), to.getId());

        // when
        notificationEventListener.handleRecommendationWritten(event);

        // then
        val found = findByType(to.getId(), NotificationType.RECOMMENDATION_WRITTEN);
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getSenderId()).isEqualTo(from.getId());
        assertThat(found.getFirst().getReferenceId()).isEqualTo(recommendationId);
    }

    @Test
    @DisplayName("handleDeviceRegistered - 디바이스 등록 이벤트를 받으면 확인 알림이 저장된다")
    void handleDeviceRegistered_success() {
        // given
        val member = saveMember("noti-device1", "01000009701");
        commitGiven();
        val event = new DeviceRegisteredEvent(member.getId());

        // when
        notificationEventListener.handleDeviceRegistered(event);

        // then
        assertThat(findByType(member.getId(), NotificationType.DEVICE_REGISTERED)).hasSize(1);
    }

    private MemberEntity saveMember(String username, String phone) {
        return memberRepository.save(MemberFactory.entity(username, phone, Role.CAREER));
    }

    private void commitGiven() {
        TestTransaction.flagForCommit();
        TestTransaction.end();
        TestTransaction.start();
    }

    private List<NotificationEntity> findByType(Long memberId, NotificationType type) {
        return notificationRepository.findAllByMemberId(memberId).stream()
                .filter(it -> it.getType() == type)
                .toList();
    }
}
