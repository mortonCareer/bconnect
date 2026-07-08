package to.bconnect.api.notification.domain;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import to.bconnect.api.core.domain.notification.NotificationArgs;
import to.bconnect.api.notification.domain.push.PushPayload;
import to.bconnect.api.notification.domain.push.PushSendResult;
import to.bconnect.api.notification.domain.push.PushSender;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.socket.message.ChatMessageSentEvent;
import to.bconnect.api.storage.device.DevicePlatform;
import to.bconnect.api.storage.device.DeviceTokenEntity;
import to.bconnect.api.storage.device.DeviceTokenRepository;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest
@DisplayName("알림 이벤트 흐름 통합: ChatMessageSentEvent 발행 → AFTER_COMMIT 리스너 → 저장·발송")
class NotificationFlowIntegrationTest {

    private static final Long CHAT_ID = 987654321L;

    @TestConfiguration
    static class TestPushConfig {
        @Bean
        @Primary
        CapturingPushSender capturingPushSender() {
            return new CapturingPushSender();
        }
    }

    static class CapturingPushSender implements PushSender {
        final List<String> sentEndpoints = new ArrayList<>();
        final List<PushPayload> sentPayloads = new ArrayList<>();
        PushSendResult.Status statusToReturn = PushSendResult.Status.SUCCESS;

        @Override
        public PushSendResult send(String endpointArn, PushPayload payload) {
            sentEndpoints.add(endpointArn);
            sentPayloads.add(payload);
            return new PushSendResult(endpointArn, statusToReturn, "it");
        }
    }

    @Autowired ApplicationEventPublisher eventPublisher;
    @Autowired PlatformTransactionManager transactionManager;
    @Autowired MemberRepository memberRepository;
    @Autowired DeviceTokenRepository deviceTokenRepository;
    @Autowired NotificationRepository notificationRepository;
    @Autowired CapturingPushSender pushSender;
    @Autowired DeviceService deviceService;

    private TransactionTemplate transactionTemplate;
    private final List<Long> createdMemberIds = new ArrayList<>();

    @BeforeEach
    void setUp() {
        transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @AfterEach
    void cleanUp() {
        // FK 순서: notifications → device_tokens → members
        notificationRepository.findAll().stream()
                .filter(it -> CHAT_ID.equals(it.getReferenceId()))
                .forEach(notificationRepository::delete);
        deviceTokenRepository.findAll().stream()
                .filter(it -> createdMemberIds.contains(it.getMemberId()))
                .forEach(deviceTokenRepository::delete);
        createdMemberIds.forEach(memberRepository::deleteById);
        createdMemberIds.clear();
        pushSender.sentEndpoints.clear();
        pushSender.sentPayloads.clear();
        pushSender.statusToReturn = PushSendResult.Status.SUCCESS;
    }

    private Long saveMember(String key) {
        var member = memberRepository.save(new MemberEntity("noti-" + key, "name", "010-" + key, Role.USER));
        createdMemberIds.add(member.getId());
        return member.getId();
    }

    @Test
    @DisplayName("커밋 후 리스너가 전 수신자에게 알림을 저장하고, 비활성 수신자에게만 푸시한다")
    void event_persistsForAllRecipients_pushesInactiveOnly() {
        Long sender = saveMember("sender");
        Long active = saveMember("active");
        Long inactive = saveMember("inactive");
        deviceTokenRepository.save(new DeviceTokenEntity(active, "tok-active", DevicePlatform.web, "arn:active"));
        deviceTokenRepository.save(new DeviceTokenEntity(inactive, "tok-inactive", DevicePlatform.web, "arn:inactive"));

        transactionTemplate.executeWithoutResult(status ->
                eventPublisher.publishEvent(new ChatMessageSentEvent(
                        sender, CHAT_ID, List.of(active, inactive), Set.of(active), "통합테스트 메시지")));

        var saved = notificationRepository.findAll().stream()
                .filter(it -> CHAT_ID.equals(it.getReferenceId()))
                .toList();
        assertThat(saved).extracting(NotificationEntity::getReceiverId)
                .containsExactlyInAnyOrder(active, inactive);
        assertThat(saved).allSatisfy(n -> {
            assertThat(n.getTypeCode()).isEqualTo("CHAT_MESSAGE");
            assertThat(n.getSenderId()).isEqualTo(sender);
            assertThat(n.getContent()).isEqualTo("통합테스트 메시지");
            assertThat(NotificationArgs.fromJson(n.getTemplateArgs()).get(NotificationArgs.SENDER_NAME))
                    .isEqualTo("name");
        });
        assertThat(pushSender.sentEndpoints).containsExactly("arn:inactive");
    }

    @Test
    @DisplayName("트랜잭션 안에서 발행된 이벤트만 처리된다 — 커밋이 없으면(롤백) 아무 것도 저장·발송되지 않는다")
    void event_rolledBack_noSideEffects() {
        Long sender = saveMember("rb-sender");
        Long receiver = saveMember("rb-receiver");
        deviceTokenRepository.save(new DeviceTokenEntity(receiver, "tok-rb", DevicePlatform.web, "arn:rb"));

        transactionTemplate.executeWithoutResult(status -> {
            eventPublisher.publishEvent(new ChatMessageSentEvent(
                    sender, CHAT_ID, List.of(receiver), Set.of(), "롤백 메시지"));
            status.setRollbackOnly();
        });

        var saved = notificationRepository.findAll().stream()
                .filter(it -> CHAT_ID.equals(it.getReferenceId()))
                .toList();
        assertThat(saved).isEmpty();
        assertThat(pushSender.sentEndpoints).isEmpty();
    }

    @Test
    @DisplayName("DeviceService 로 등록한 device 의 endpoint 로 push 가 나가고, 렌더된 title/body/link 가 실린다")
    void registeredDevice_receivesRenderedPush() {
        Long sender = saveMember("reg-sender");
        Long receiver = saveMember("reg-receiver");
        var user = new AuthUser(receiver, String.valueOf(receiver), "USER");
        deviceService.register(user, "fcm-reg-token", DevicePlatform.web);

        var device = deviceTokenRepository.findByToken("fcm-reg-token").orElseThrow();
        assertThat(device.getSnsEndpointArn()).startsWith("arn:aws:sns:local");

        transactionTemplate.executeWithoutResult(status ->
                eventPublisher.publishEvent(new ChatMessageSentEvent(
                        sender, CHAT_ID, List.of(receiver), Set.of(), "안녕하세요")));

        assertThat(pushSender.sentEndpoints).containsExactly(device.getSnsEndpointArn());
        var payload = pushSender.sentPayloads.getFirst();
        assertThat(payload.title()).isEqualTo("name님이 메시지를 보냈습니다");
        assertThat(payload.body()).isEqualTo("안녕하세요");
        assertThat(payload.link()).isEqualTo("/n/chat_room/" + CHAT_ID);
    }

    @Test
    @DisplayName("push 결과가 EXPIRED 면 device 가 DB 에서 비활성화된다")
    void pushExpired_disablesDeviceInDb() {
        Long sender = saveMember("exp-sender");
        Long receiver = saveMember("exp-receiver");
        var device = deviceTokenRepository.save(
                new DeviceTokenEntity(receiver, "tok-exp", DevicePlatform.web, "arn:exp"));
        pushSender.statusToReturn = PushSendResult.Status.EXPIRED;

        transactionTemplate.executeWithoutResult(status ->
                eventPublisher.publishEvent(new ChatMessageSentEvent(
                        sender, CHAT_ID, List.of(receiver), Set.of(), "hi")));

        var reloaded = deviceTokenRepository.findById(device.getId()).orElseThrow();
        assertThat(reloaded.isEnabled()).isFalse();
    }

    @Test
    @DisplayName("한 회원의 device 가 여러 개면 enabled device 로만 push 한다")
    void multipleDevices_pushOnlyEnabled() {
        Long sender = saveMember("multi-sender");
        Long receiver = saveMember("multi-receiver");
        deviceTokenRepository.save(new DeviceTokenEntity(receiver, "tok-on", DevicePlatform.web, "arn:on"));
        var off = deviceTokenRepository.save(new DeviceTokenEntity(receiver, "tok-off", DevicePlatform.web, "arn:off"));
        off.disable();
        deviceTokenRepository.save(off);

        transactionTemplate.executeWithoutResult(status ->
                eventPublisher.publishEvent(new ChatMessageSentEvent(
                        sender, CHAT_ID, List.of(receiver), Set.of(), "hi")));

        assertThat(pushSender.sentEndpoints).containsExactly("arn:on");
    }
}
