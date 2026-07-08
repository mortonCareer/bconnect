package to.bconnect.api.notification.presentation.v1.response;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.core.domain.notification.Notification;
import to.bconnect.api.core.domain.notification.NotificationArgs;
import to.bconnect.api.notification.domain.NotificationType;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationResponseTest {

    private Notification notification(Long senderId, NotificationArgs args) {
        return new Notification(1L, senderId, 2L, "CHAT_MESSAGE", 42L, "안녕", args, false, null);
    }

    private Notification notification(Long senderId) {
        return notification(senderId, NotificationArgs.senderName("홍길동"));
    }

    private Member member(String name) {
        return new Member(9L, "u9", name, "010", null, null, null);
    }

    @Test
    @DisplayName("메시지는 저장된 args 로 렌더하고, referenceType 은 소문자로 내려간다")
    void renders_senderNameAndLowercaseReferenceType() {
        var response = NotificationResponse.of(
                notification(9L), NotificationType.CHAT_MESSAGE, member("홍길동"), "https://cdn.test/profile.jpg");

        assertThat(response.type()).isEqualTo("CHAT_MESSAGE");
        assertThat(response.message()).isEqualTo("홍길동님이 메시지를 보냈습니다");
        assertThat(response.referenceType()).isEqualTo("chat_room");
        assertThat(response.referenceId()).isEqualTo(42L);
        assertThat(response.sender().name()).isEqualTo("홍길동");
        assertThat(response.sender().picture()).isEqualTo("https://cdn.test/profile.jpg");
        assertThat(response.content()).isEqualTo("안녕");
        assertThat(response.read()).isFalse();
    }

    @Test
    @DisplayName("sender 가 개명되어도 저장된 args 기준으로 렌더된다")
    void renders_usesSnapshotArgs() {
        var n = notification(9L, NotificationArgs.senderName("옛이름"));

        var before = NotificationResponse.of(n, NotificationType.CHAT_MESSAGE, member("옛이름"), null);
        var after = NotificationResponse.of(n, NotificationType.CHAT_MESSAGE, member("새이름"), null);

        assertThat(before.message()).isEqualTo("옛이름님이 메시지를 보냈습니다");
        assertThat(after.message()).isEqualTo("옛이름님이 메시지를 보냈습니다");
    }

    @Test
    @DisplayName("기존 데이터처럼 args 가 비어 있으면 현재 sender 이름으로 fallback 렌더한다")
    void renders_fallbackForOldRowsWithoutArgs() {
        var n = notification(9L, NotificationArgs.empty());

        var response = NotificationResponse.of(n, NotificationType.CHAT_MESSAGE, member("현재이름"), null);

        assertThat(response.message()).isEqualTo("현재이름님이 메시지를 보냈습니다");
    }
}
