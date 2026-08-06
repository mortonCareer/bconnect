package to.bconnect.api.notification.domain;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.notification.domain.push.PushPayload;
import to.bconnect.api.notification.domain.push.PushSendResult;
import to.bconnect.api.notification.domain.push.PushSender;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationPushService {

    private final DeviceService deviceService;
    private final PushSender pushSender;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void push(List<PushNotification> notifications) {
        notifications.forEach(it -> {
            val payload = PushPayload.of(it);

            deviceService.list(it.memberId()).forEach(device -> {
                try {
                    val result = pushSender.send(device.getEndpoint(), payload);
                    if (result == PushSendResult.EXPIRED || result == PushSendResult.INVALID) {
                        device.disable();
                        log.info("유효하지 않은 endpoint 비활성화: memberId={}, status={}", it.memberId(), result);
                    }
                } catch (Exception e) {
                    log.warn("푸시 발송 실패: memberId={}", it.memberId(), e);
                }
            });
        });
    }
}
