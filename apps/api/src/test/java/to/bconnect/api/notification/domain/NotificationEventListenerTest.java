package to.bconnect.api.notification.domain;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.security.session.NewDeviceLoginEvent;
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationRepository;
import to.bconnect.api.storage.notification.NotificationType;
import to.bconnect.api.support.IntegrationTest;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
class NotificationEventListenerTest {

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
}
