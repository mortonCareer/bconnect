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
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationRepository;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final DeviceService deviceService;
    private final PushSender pushSender;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notify(List<PushNotification> commands) {
        if (commands.isEmpty()) return;

        val saved = notificationRepository.saveAll(commands.stream()
                .map(it -> new NotificationEntity(
                        it.memberId(),
                        it.type(),
                        it.senderType(),
                        it.senderId(),
                        it.referenceType(),
                        it.referenceId(),
                        false))
                .toList());

        for (int i = 0; i < saved.size(); i++) {
            val command = commands.get(i);
            val entity = saved.get(i);
            val payload = PushPayload.of(entity.getId(), command);

            deviceService.list(command.memberId()).forEach(device -> {
                try {
                    val result = pushSender.send(device.getEndpoint(), payload);
                    if (result == PushSendResult.EXPIRED || result == PushSendResult.INVALID) {
                        device.disable();
                        log.info("유효하지 않은 endpoint 비활성화: memberId={}, status={}", command.memberId(), result);
                    }
                } catch (Exception e) {
                    log.warn("푸시 발송 실패: memberId={}", command.memberId(), e);
                }
            });
        }
    }
}
