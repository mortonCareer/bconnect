package to.bconnect.api.notification.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import to.bconnect.api.notification.domain.push.PushPayload;
import to.bconnect.api.notification.domain.push.PushSendResult;
import to.bconnect.api.notification.domain.push.PushSender;
import to.bconnect.api.socket.message.SocketMessageSentEvent;
import to.bconnect.api.storage.device.DevicePlatform;
import to.bconnect.api.storage.device.DeviceTokenEntity;
import to.bconnect.api.storage.device.DeviceTokenRepository;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.notification.NotificationRepository;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * 이슈 #788 회귀 방지: 채팅 알림은 수신자의 모든 활성 디바이스로 발송되어야 한다.
 * 실제 Postgres(Testcontainers) 위에서 알림 저장·발송·실패 격리·endpoint 비활성화를 검증한다.
 * REQUIRES_NEW 로 커밋되는 handle() 이 사전 저장 데이터를 보도록 비트랜잭션으로 구동한다.
 */
@SpringBootTest
@ActiveProfiles("test")
class ChatNotificationIntegrationTest {

    @Autowired private NotificationService notificationService;
    @Autowired private MemberRepository memberRepository;
    @Autowired private DeviceTokenRepository deviceTokenRepository;
    @Autowired private NotificationRepository notificationRepository;

    @MockitoBean private PushSender pushSender;

    private Long senderId;
    private Long receiverId;

    @BeforeEach
    void setUp() {
        // 비트랜잭션 구동이라 커밋이 남는다. username·phone 은 부분 unique 인덱스가 있어 테스트마다 고유값으로 격리한다.
        String uniq = java.util.UUID.randomUUID().toString();
        senderId = memberRepository.save(new MemberEntity("sender-" + uniq, "발신자", "p-" + uniq, Set.of(Role.CAREER))).getId();
        receiverId = memberRepository.save(new MemberEntity("receiver-" + uniq, "수신자", "r-" + uniq, Set.of(Role.CAREER))).getId();
    }

    @Test
    @DisplayName("수신자의 모든 활성 디바이스로 발송되고, 회원당 알림 1건이 저장된다")
    void handle_sendsToAllActiveDevices_andPersistsOnce() {
        when(pushSender.send(any(), any())).thenReturn(PushSendResult.success("arn", "mid"));
        saveDevice("tok-A1", "arn-1");
        saveDevice("tok-A2", "arn-2");

        notificationService.handle(NotificationType.CHAT_MESSAGE, chatEvent("안녕하세요"));

        assertThat(notificationRepository.countByReceiverIdAndReadAtIsNull(receiverId)).isEqualTo(1);
        verify(pushSender, times(2)).send(any(), any(PushPayload.class));
        verify(pushSender).send(eq("arn-1"), any(PushPayload.class));
        verify(pushSender).send(eq("arn-2"), any(PushPayload.class));
    }

    @Test
    @DisplayName("한 디바이스 발송 실패가 다른 활성 디바이스 발송을 막지 않는다")
    void handle_oneDeviceFailure_doesNotBlockOthers() {
        when(pushSender.send(eq("arn-1"), any())).thenThrow(new RuntimeException("SNS unavailable"));
        when(pushSender.send(eq("arn-2"), any())).thenReturn(PushSendResult.success("arn-2", "mid"));
        saveDevice("tok-B1", "arn-1");
        saveDevice("tok-B2", "arn-2");

        notificationService.handle(NotificationType.CHAT_MESSAGE, chatEvent("hi"));

        // 첫 디바이스 예외 이후에도 두 번째 디바이스로 발송 시도됨
        verify(pushSender).send(eq("arn-1"), any());
        verify(pushSender).send(eq("arn-2"), any());
    }

    @Test
    @DisplayName("EXPIRED 응답 디바이스만 비활성화되고 유효한 디바이스는 유지된다")
    void handle_expiredEndpoint_disablesOnlyThatDevice() {
        when(pushSender.send(eq("arn-1"), any())).thenReturn(PushSendResult.expired("arn-1"));
        when(pushSender.send(eq("arn-2"), any())).thenReturn(PushSendResult.success("arn-2", "mid"));
        Long expiredDeviceId = saveDevice("tok-C1", "arn-1");
        Long validDeviceId = saveDevice("tok-C2", "arn-2");

        notificationService.handle(NotificationType.CHAT_MESSAGE, chatEvent("hi"));

        assertThat(deviceTokenRepository.findById(expiredDeviceId).orElseThrow().isEnabled()).isFalse();
        assertThat(deviceTokenRepository.findById(validDeviceId).orElseThrow().isEnabled()).isTrue();
    }

    private Long saveDevice(String token, String endpointArn) {
        return deviceTokenRepository.save(
                new DeviceTokenEntity(receiverId, token, DevicePlatform.web, endpointArn)).getId();
    }

    private SocketMessageSentEvent chatEvent(String preview) {
        return new SocketMessageSentEvent(999L, senderId, Set.of(), Set.of(receiverId), preview);
    }
}
