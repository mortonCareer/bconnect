package to.bconnect.api.core.presentation.v1.response;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.core.domain.notification.Notification;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.notification.NotificationReferenceType;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationResponseTest {

    private Notification notification(Long senderId) {
        return new Notification(1L, senderId, 2L, "CHAT_MESSAGE", 42L, "안녕", false, null);
    }

    private Member member(String name) {
        return new Member(9L, "u9", name, "010", null, null, null, null);
    }

    @Test
    @DisplayName("{sender} 가 현재 sender 이름으로 렌더되고 referenceType 은 소문자로 내려간다")
    void renders_senderNameAndLowercaseReferenceType() {
        var response = NotificationResponse.of(
                notification(9L), "{sender}님이 메시지를 보냈습니다", NotificationReferenceType.CHAT_ROOM, member("홍길동"));

        assertThat(response.message()).isEqualTo("홍길동님이 메시지를 보냈습니다");
        assertThat(response.referenceType()).isEqualTo("chat_room");
        assertThat(response.referenceId()).isEqualTo(42L);
        assertThat(response.sender().name()).isEqualTo("홍길동");
        assertThat(response.content()).isEqualTo("안녕");
        assertThat(response.read()).isFalse();
    }

    @Test
    @DisplayName("sender 가 개명되면 다음 조회에서 새 이름으로 렌더된다(render-on-read)")
    void renders_reflectsRenamedSender() {
        var n = notification(9L);

        var before = NotificationResponse.of(n, "{sender}님", NotificationReferenceType.CHAT_ROOM, member("옛이름"));
        var after = NotificationResponse.of(n, "{sender}님", NotificationReferenceType.CHAT_ROOM, member("새이름"));

        assertThat(before.message()).isEqualTo("옛이름님");
        assertThat(after.message()).isEqualTo("새이름님");
    }

    @Test
    @DisplayName("시스템 알림(sender 없음)은 {sender} 가 빈 문자열로 치환되고 sender 요약은 null 이다")
    void renders_systemNotificationWithoutSender() {
        var response = NotificationResponse.of(
                notification(null), "{sender}공지", NotificationReferenceType.CHAT_ROOM, null);

        assertThat(response.message()).isEqualTo("공지");
        assertThat(response.sender()).isNull();
    }
}
