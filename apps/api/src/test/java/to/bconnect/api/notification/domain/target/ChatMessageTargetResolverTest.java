package to.bconnect.api.notification.domain.target;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.notification.domain.NotificationType;
import to.bconnect.api.socket.message.ChatMessageSentEvent;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ChatMessageTargetResolverTest {

    private final ChatMessageTargetResolver resolver = new ChatMessageTargetResolver();

    @Test
    @DisplayName("supports 는 CHAT_MESSAGE 다")
    void supports_chatMessage() {
        assertThat(resolver.supports()).isEqualTo(NotificationType.CHAT_MESSAGE);
    }

    @Test
    @DisplayName("저장 대상은 전 수신자, push 대상은 활성 사용자를 제외한 수신자다")
    void resolve_splitsPersistAndPushTargets() {
        var event = new ChatMessageSentEvent(1L, 50L, List.of(10L, 11L, 12L), Set.of(11L), "안녕");

        var resolved = resolver.resolve(event);

        assertThat(resolved.senderId()).isEqualTo(1L);
        assertThat(resolved.referenceId()).isEqualTo(50L);
        assertThat(resolved.content()).isEqualTo("안녕");
        assertThat(resolved.targets().persistReceiverIds()).containsExactlyInAnyOrder(10L, 11L, 12L);
        assertThat(resolved.targets().pushReceiverIds()).containsExactlyInAnyOrder(10L, 12L);
    }
}
