package to.bconnect.api.notification.domain.target;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.notification.domain.NotificationType;
import to.bconnect.api.socket.message.SocketMessageSentEvent;
import to.bconnect.api.storage.chat.ChatType;
import to.bconnect.api.storage.chat.MessageType;

import java.time.Instant;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ChatMessageTargetResolverTest {

    private final ChatMessageTargetResolver resolver = new ChatMessageTargetResolver();

    @Test
    @DisplayName("CHAT_MESSAGE 타입을 지원한다")
    void supports() {
        assertThat(resolver.supports()).isEqualTo(NotificationType.CHAT_MESSAGE);
    }

    @Test
    @DisplayName("비활성 수신자만 저장·push 대상이다")
    void resolve_pushesToInactiveRecipients() {
        var event = new SocketMessageSentEvent(Set.of(4L), Set.of(2L, 3L),
                new Message(100L, 10L, ChatType.DIRECT, 1L, MessageType.TEXT, "안녕하세요",
                        Instant.now(), Instant.now()));

        var resolved = resolver.resolve(event);

        assertThat(resolved.senderId()).isEqualTo(1L);
        assertThat(resolved.referenceId()).isEqualTo(10L);
        assertThat(resolved.content()).isEqualTo("안녕하세요");
        assertThat(resolved.targets().persistReceiverIds()).containsExactlyInAnyOrder(2L, 3L);
        assertThat(resolved.targets().pushReceiverIds()).containsExactlyInAnyOrder(2L, 3L);
    }
}
