package to.bconnect.api.notification.domain.target;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.socket.message.SocketMessageSentEvent;
import to.bconnect.api.storage.notification.NotificationType;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ChatMessageTargetResolverTest {

    private final MemberResolver memberResolver = mock(MemberResolver.class);
    private final ChatMessageTargetResolver resolver = new ChatMessageTargetResolver(memberResolver);

    @Test
    @DisplayName("CHAT_MESSAGE 타입을 지원한다")
    void supports() {
        assertThat(resolver.supports()).isEqualTo(NotificationType.CHAT_MESSAGE);
    }

    @Test
    @DisplayName("비활성 수신자만 저장·push 대상이다")
    void resolve_pushesToInactiveRecipients() {
        when(memberResolver.get(1L)).thenReturn(new Member(1L, "sender", "발신자", "p", null, null, null));
        var event = new SocketMessageSentEvent(10L, 1L, Set.of(4L), Set.of(2L, 3L), "안녕하세요");

        var resolved = resolver.resolve(event);

        assertThat(resolved.senderId()).isEqualTo(1L);
        assertThat(resolved.referenceId()).isEqualTo(10L);
        assertThat(resolved.content()).isEqualTo("안녕하세요");
        assertThat(resolved.args().senderName()).isEqualTo("발신자");
        assertThat(resolved.targets().persistReceiverIds()).containsExactlyInAnyOrder(2L, 3L);
        assertThat(resolved.targets().pushReceiverIds()).containsExactlyInAnyOrder(2L, 3L);
    }
}
