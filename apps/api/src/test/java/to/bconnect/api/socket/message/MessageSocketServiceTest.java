package to.bconnect.api.socket.message;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.user.SimpSession;
import org.springframework.messaging.simp.user.SimpSubscription;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.domain.chat.MessageService;
import to.bconnect.api.core.domain.chat.SendMessage;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.chat.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageSocketServiceTest {

    @Mock private MessageService messageService;
    @Mock private ParticipantRepository participantRepository;
    @Mock private DirectChatRepository directChatRepository;
    @Mock private SimpUserRegistry simpUserRegistry;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private MessageSocketService service;

    @Test
    @DisplayName("WebSocket principal name(=회원 ID)을 회원 ID로 직접 해석해 활성 구독자의 읽음 위치를 갱신한다")
    void broadcast_marksReadForActiveSubscriberByPrincipalId() {
        // DIRECT 방: minId=1(발신자), maxId=2(상대). 상대(2)가 활성 구독자.
        var sender = new AuthUser(1L, "1", "WORKER");
        var chat = DirectChatEntity.of(1L, 2L);
        long messageId = 100L;

        // principal.getName() == "2" (username 아님, 회원 ID 문자열) — 중첩 스터빙 방지 위해 미리 생성
        var activeSubscription = subscriptionOf("2");
        when(messageService.create(any(), any(), any(), any())).thenReturn(message(messageId));
        when(directChatRepository.findById(10L)).thenReturn(Optional.of(chat));
        when(simpUserRegistry.findSubscriptions(any())).thenReturn(Set.of(activeSubscription));

        service.broadcast(sender, 10L, ChatType.DIRECT,
                new SendMessage(MessageType.TEXT, "hello", List.of()));

        // 회원 2(maxId)의 읽음 위치가 새 messageId 로 갱신됨 → name "2" 를 회원 ID 로 해석했다는 증거
        assertThat(chat.getMaxLastIdx()).isEqualTo(messageId);
        // 활성 구독자가 아닌 발신자(1)는 갱신되지 않음
        assertThat(chat.getMinLastIdx()).isEqualTo(0L);
    }

    private static Message message(long id) {
        return new Message(id, 10L, 1L, MessageType.TEXT, "hello",
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
