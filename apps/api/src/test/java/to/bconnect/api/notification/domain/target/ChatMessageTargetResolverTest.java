package to.bconnect.api.notification.domain.target;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.notification.domain.NotificationType;
import to.bconnect.api.socket.message.ChatMessageSentEvent;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ChatMessageTargetResolverTest {

    private final ChatMessageTargetResolver resolver = new ChatMessageTargetResolver();

    @Test
    @DisplayName("CHAT_MESSAGE 타입을 지원한다")
    void supports() {
        assertThat(resolver.supports()).isEqualTo(NotificationType.CHAT_MESSAGE);
    }

    @Test
    @DisplayName("수신자 전원이 저장·push 대상이다 — 활성 사용자 제외 정책 없음")
    void resolve_pushesToAllRecipients() {
        var event = new ChatMessageSentEvent(1L, 10L, List.of(2L, 3L), "안녕하세요");

        var resolved = resolver.resolve(event);

        assertThat(resolved.senderId()).isEqualTo(1L);
        assertThat(resolved.referenceId()).isEqualTo(10L);
        assertThat(resolved.content()).isEqualTo("안녕하세요");
        assertThat(resolved.targets().persistReceiverIds()).containsExactlyInAnyOrder(2L, 3L);
        // push 대상 == 저장 대상 (활성 여부로 걸러내지 않음)
        assertThat(resolved.targets().pushReceiverIds()).containsExactlyInAnyOrder(2L, 3L);
    }
}
