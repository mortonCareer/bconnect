package to.bconnect.api.storage.notification;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationEntityTest {

    private NotificationEntity chatNotification() {
        return new NotificationEntity(1L, 2L, "CHAT_MESSAGE", 42L, "안녕하세요");
    }

    @Test
    @DisplayName("새 알림은 readAt 이 null 이라 isRead 가 false 다")
    void newNotification_isUnread() {
        NotificationEntity notification = chatNotification();

        assertThat(notification.getReadAt()).isNull();
        assertThat(notification.isRead()).isFalse();
    }

    @Test
    @DisplayName("markRead 하면 readAt 이 채워지고 isRead 가 true 가 된다")
    void markRead_setsReadAt() {
        NotificationEntity notification = chatNotification();

        notification.markRead();

        assertThat(notification.getReadAt()).isNotNull();
        assertThat(notification.isRead()).isTrue();
    }

    @Test
    @DisplayName("markRead 를 두 번 호출해도 최초 읽은 시각이 덮어써지지 않는다(멱등)")
    void markRead_isIdempotent() {
        NotificationEntity notification = chatNotification();
        notification.markRead();
        var firstReadAt = notification.getReadAt();

        notification.markRead();

        assertThat(notification.getReadAt()).isEqualTo(firstReadAt);
    }
}
