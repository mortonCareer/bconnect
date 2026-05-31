package to.bconnect.api.domain;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.user.SimpSession;
import org.springframework.messaging.simp.user.SimpSubscription;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import to.bconnect.api.api.controller.v1.request.SendMessageRequest;
import to.bconnect.api.domain.chat.Message;
import to.bconnect.api.domain.chat.MessageService;
import to.bconnect.api.storage.domain.chat.ChatEntity;
import to.bconnect.api.storage.domain.chat.MessageRepository;
import to.bconnect.api.storage.domain.chat.ParticipantEntity;
import to.bconnect.api.storage.domain.chat.ParticipantRepository;
import to.bconnect.api.storage.domain.member.MemberEntity;
import to.bconnect.api.storage.domain.member.MemberRepository;
import to.bconnect.api.storage.common.value.MessageType;
import to.bconnect.api.storage.common.value.Role;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.support.UnitTest;
import to.bconnect.api.support.security.User;
import to.bconnect.api.support.fixture.ChatFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.MessageFactory;
import to.bconnect.api.support.fixture.ParticipantFactory;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@UnitTest
@DisplayName("MessageService 테스트")
class MessageServiceTest {

    @Autowired private MessageService messageService;
    @Autowired private MessageRepository messageRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private ParticipantRepository participantRepository;
    @Autowired private ChatFactory chatFactory;
    @Autowired private ParticipantFactory participantFactory;
    @Autowired private EntityManager entityManager;

    @MockitoBean private SimpUserRegistry simpUserRegistry;

    @Nested
    @DisplayName("MessageService.broadcast")
    class BroadcastTests {

        @Test
        @DisplayName("S1: 다수 구독자(발신자 포함)의 lastIdx가 새 메시지 id로 일괄 갱신된다")
        void broadcast_updatesLastIdxForSubscribers() {
            // given
            ChatEntity chat = chatFactory.create();
            Long chatId = chat.getId();

            MemberEntity memberA = memberRepository.save(
                    MemberFactory.createEntity("usernameA", "phoneA", Role.FOREMAN));
            MemberEntity memberB = memberRepository.save(
                    MemberFactory.createEntity("usernameB", "phoneB", Role.FOREMAN));
            MemberEntity memberC = memberRepository.save(
                    MemberFactory.createEntity("usernameC", "phoneC", Role.FOREMAN));
            MemberEntity memberD = memberRepository.save(
                    MemberFactory.createEntity("usernameD", "phoneD", Role.FOREMAN));

            participantFactory.create(chatId, memberA.getId());
            participantFactory.create(chatId, memberB.getId());
            participantFactory.create(chatId, memberC.getId());
            participantFactory.create(chatId, memberD.getId());

            SimpSubscription subA = mockSubscription(memberA.getUsername());
            SimpSubscription subB = mockSubscription(memberB.getUsername());
            SimpSubscription subC = mockSubscription(memberC.getUsername());
            when(simpUserRegistry.findSubscriptions(any())).thenReturn(Set.of(subA, subB, subC));

            User sender = new User(memberA.getId(), memberA.getUsername(), Role.FOREMAN.name());
            SendMessageRequest request = MessageFactory.createRequest();

            // when
            Message result = messageService.broadcast(sender, chatId, request);
            entityManager.flush();
            entityManager.clear();

            // then
            assertThat(result.id()).isNotNull();
            assertThat(result.chatId()).isEqualTo(chatId);
            assertThat(result.memberId()).isEqualTo(memberA.getId());
            assertThat(result.type()).isEqualTo(MessageType.TEXT);
            assertThat(result.content()).isEqualTo("content");

            Map<Long, Long> lastIdxByMemberId = participantRepository.findByChatIdIn(Set.of(chatId)).stream()
                    .collect(Collectors.toMap(ParticipantEntity::getMemberId, ParticipantEntity::getLastIdx));
            assertThat(lastIdxByMemberId.get(memberA.getId())).isEqualTo(result.id());
            assertThat(lastIdxByMemberId.get(memberB.getId())).isEqualTo(result.id());
            assertThat(lastIdxByMemberId.get(memberC.getId())).isEqualTo(result.id());
            assertThat(lastIdxByMemberId.get(memberD.getId())).isEqualTo(0L);
        }

        @Test
        @DisplayName("S2: 발신자만 구독 중이면 발신자 lastIdx만 갱신된다")
        void broadcast_updatesOnlySenderWhenSoleSubscriber() {
            // given
            ChatEntity chat = chatFactory.create();
            Long chatId = chat.getId();

            MemberEntity memberA = memberRepository.save(
                    MemberFactory.createEntity("usernameA", "phoneA", Role.FOREMAN));
            MemberEntity memberB = memberRepository.save(
                    MemberFactory.createEntity("usernameB", "phoneB", Role.FOREMAN));

            participantFactory.create(chatId, memberA.getId());
            participantFactory.create(chatId, memberB.getId());

            SimpSubscription subA = mockSubscription(memberA.getUsername());
            when(simpUserRegistry.findSubscriptions(any())).thenReturn(Set.of(subA));

            User sender = new User(memberA.getId(), memberA.getUsername(), Role.FOREMAN.name());
            SendMessageRequest request = MessageFactory.createRequest();

            // when
            Message result = messageService.broadcast(sender, chatId, request);
            entityManager.flush();
            entityManager.clear();

            // then
            Map<Long, Long> lastIdxByMemberId = participantRepository.findByChatIdIn(Set.of(chatId)).stream()
                    .collect(Collectors.toMap(ParticipantEntity::getMemberId, ParticipantEntity::getLastIdx));
            assertThat(lastIdxByMemberId.get(memberA.getId())).isEqualTo(result.id());
            assertThat(lastIdxByMemberId.get(memberB.getId())).isEqualTo(0L);
        }

        @Test
        @DisplayName("S5: SYSTEM 타입은 NOT_VALID 예외를 발생시키고 메시지를 저장하지 않는다")
        void broadcast_rejectsSystemType() {
            // given
            ChatEntity chat = chatFactory.create();
            Long chatId = chat.getId();
            User sender = new User(1L, "usernameA", Role.FOREMAN.name());
            SendMessageRequest request = MessageFactory.createRequest(MessageType.SYSTEM, "system");
            long messageCountBefore = messageRepository.count();

            // when & then
            assertCodeException(() -> messageService.broadcast(sender, chatId, request))
                    .hasExceptionCode(CommonExceptionCode.NOT_VALID);

            assertThat(messageRepository.count()).isEqualTo(messageCountBefore);
        }
    }

    private SimpSubscription mockSubscription(String username) {
        SimpSubscription subscription = mock(SimpSubscription.class);
        SimpSession session = mock(SimpSession.class);
        SimpUser user = mock(SimpUser.class);
        when(subscription.getSession()).thenReturn(session);
        when(session.getUser()).thenReturn(user);
        when(user.getName()).thenReturn(username);
        return subscription;
    }
}
