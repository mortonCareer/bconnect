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
    @DisplayName("create - 커맨드가 있을 때 생성하면 알림이 저장되고 엔티티가 반환된다")
    void create_success() {
        // given
        val chatId = 100L;
        val senderId = 100L;
        val command = NotificationFactory.command(SEED_MEMBER_ID, senderId,
                NotificationType.CHAT_MESSAGE, NotificationReferenceType.CHAT_ROOM, chatId);

        // when
        val created = notificationService.create(List.of(command));

        // then
        val response = notificationRepository.findAllByMemberId(SEED_MEMBER_ID);
        assertThat(response).hasSize(1);
        assertThat(created).hasSize(1);
        assertThat(created.getFirst().id()).isEqualTo(response.getFirst().getId());
    }

    @Test
    @DisplayName("create - 커맨드가 비었을 때 생성하면 빈 목록이 반환된다")
    void create_empty() {
        // when
        val created = notificationService.create(List.of());

        // then
        assertThat(created).isEmpty();
    }
}
