package to.bconnect.api.notification.domain;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationRepository;
import to.bconnect.api.storage.notification.NotificationType;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.NotificationFactory;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
class NotificationServiceTest {

    private static final Long SEED_MEMBER_ID = 101L;

    @Autowired private NotificationService notificationService;
    @Autowired private NotificationRepository notificationRepository;

    @Test
    @DisplayName("notify - 커맨드가 있을 때 발송하면 알림이 저장된다")
    void notify_success() {
        // given
        val chatId = 100L;
        val senderId = 100L;
        val command = NotificationFactory.command(SEED_MEMBER_ID, senderId,
                NotificationType.CHAT_MESSAGE, NotificationReferenceType.CHAT_ROOM, chatId);

        // when
        notificationService.notify(List.of(command));

        // then
        val response = notificationRepository.findAllByMemberId(SEED_MEMBER_ID);
        assertThat(response).hasSize(1);
    }
}
