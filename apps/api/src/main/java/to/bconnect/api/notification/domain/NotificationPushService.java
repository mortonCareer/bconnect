package to.bconnect.api.notification.domain;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.notification.domain.push.PushNotification;
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
            val devices = deviceService.list(it.receiverId());
            if (devices.isEmpty()) {
                log.info("발송 대상 device 없음: receiverId={}", it.receiverId());
                return;
            }
            devices.forEach(device -> {
                try {
                    val result = pushSender.send(device.getEndpoint(), it);
                    if (result == PushSendResult.EXPIRED || result == PushSendResult.INVALID) {
                        device.disable();
                        log.info("유효하지 않은 endpoint 비활성화: receiverId={}, status={}", it.receiverId(), result);
                    }
                } catch (Exception e) {
                    log.warn("푸시 발송 실패: receiverId={}", it.receiverId(), e);
                }
            });
        });
    }
}
