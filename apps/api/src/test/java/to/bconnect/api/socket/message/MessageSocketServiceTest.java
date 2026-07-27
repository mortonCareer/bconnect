package to.bconnect.api.socket.message;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.user.SimpSession;
import org.springframework.messaging.simp.user.SimpSubscription;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import to.bconnect.api.core.domain.chat.GroupChatService;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.domain.chat.SendMessage;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.chat.ChatType;
import to.bconnect.api.storage.chat.MessageType;
import to.bconnect.api.storage.member.Role;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageSocketServiceTest {

    @Mock private MessageService messageService;
    @Mock private GroupChatService groupChatService;
    @Mock private SimpUserRegistry simpUserRegistry;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private MessageSocketService service;

    @Test
    @DisplayName("WebSocket principal name(=회원 ID)을 회원 ID로 직접 해석해 활성·비활성 수신자를 분리한다")
    void broadcast_splitsRecipientsByPrincipalId() {
        // DIRECT 방 참여자 1(발신자)·2(상대). 상대(2)만 구독 중.
        var sender = new AuthUser(1L, "1", Set.of(Role.CAREER));

        // principal.getName() == "2" (username 아님, 회원 ID 문자열) — 중첩 스터빙 방지 위해 미리 생성
        var activeSubscription = subscriptionOf("2");
        when(messageService.create(any(), any(), any(), any())).thenReturn(message(100L));
        when(groupChatService.findParticipantIds(10L, ChatType.DIRECT)).thenReturn(Set.of(1L, 2L));
        when(simpUserRegistry.findSubscriptions(any())).thenReturn(Set.of(activeSubscription));

        service.broadcast(sender, 10L, ChatType.DIRECT,
                new SendMessage(MessageType.TEXT, "hello", List.of()));

        var captor = ArgumentCaptor.forClass(SocketMessageSentEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        var event = captor.getValue();

        // name "2" 가 회원 ID 2 로 해석돼 활성으로 분류됨
        assertThat(event.activeIds()).containsExactly(2L);
        assertThat(event.inactiveIds()).containsExactly(1L);
        assertThat(event.message().chatId()).isEqualTo(10L);
        assertThat(event.message().memberId()).isEqualTo(1L);
        assertThat(event.message().content()).isEqualTo("hello");
    }

    private static Message message(long id) {
        return new Message(id, 10L, ChatType.DIRECT, 1L, MessageType.TEXT, "hello",
                Instant.now(), Instant.now());
    }

    private static SimpSubscription subscriptionOf(String principalName) {
        SimpUser user = mock(SimpUser.class);
        when(user.getName()).thenReturn(principalName);
        SimpSession session = mock(SimpSession.class);
        when(session.getUser()).thenReturn(user);
        SimpSubscription subscription = mock(SimpSubscription.class);
        when(subscription.getSession()).thenReturn(session);
        return subscription;
    }
}
