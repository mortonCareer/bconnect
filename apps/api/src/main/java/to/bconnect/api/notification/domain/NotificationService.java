package to.bconnect.api.notification.domain;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.core.domain.notification.NotificationLinkCommand;
import to.bconnect.api.core.domain.notification.NotificationLinker;
import to.bconnect.api.notification.domain.push.PushNotification;
import to.bconnect.api.notification.domain.push.PushPayload;
import to.bconnect.api.notification.domain.push.PushSendResult;
import to.bconnect.api.notification.domain.push.PushSender;
import to.bconnect.api.notification.domain.target.NotificationTargetResolverRegistry;
import to.bconnect.api.notification.domain.target.ResolvedNotification;

import java.util.Map;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationTargetResolverRegistry resolverRegistry;
    private final NotificationLinker notificationLinker;
    private final DeviceService deviceService;
    private final NotificationMessageFactory messageFactory;
    private final PushSender pushSender;

    // 이벤트 커밋 후 새 트랜잭션에서 저장·발송. disable() 은 이 트랜잭션에서 영속화됨.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handle(NotificationType typeCode, Object event) {
        ResolvedNotification resolved = resolverRegistry.get(typeCode).resolve(event);

        Set<Long> persistReceiverIds = resolved.targets().persistReceiverIds();
        if (persistReceiverIds.isEmpty()) return;

        var args = messageFactory.createArgs(typeCode, resolved.senderId());
        Map<Long, Long> linked = notificationLinker.link(new NotificationLinkCommand(
                resolved.senderId(), persistReceiverIds, typeCode.code(),
                resolved.referenceId(), resolved.content(), args));

        Set<Long> pushReceiverIds = resolved.targets().pushReceiverIds();
        if (pushReceiverIds.isEmpty()) return;

        PushNotification message = messageFactory.create(
                typeCode, resolved.referenceId(), resolved.content(), args);

        pushReceiverIds.forEach(memberId -> {
            PushPayload payload = message.toPayload(linked.get(memberId));
            deviceService.pushableDevices(memberId).forEach(device -> {
                PushSendResult result;
                try {
                    result = pushSender.send(device.getSnsEndpointArn(), payload);
                } catch (Exception e) {
                    log.warn("푸시 발송 실패 memberId={}, reason={}", memberId, e.getMessage());
                    return;
                }
                if (result.status() == PushSendResult.Status.EXPIRED
                        || result.status() == PushSendResult.Status.INVALID) {
                    device.disable();
                    log.info("유효하지 않은 endpoint 비활성화 memberId={}, status={}", memberId, result.status());
                }
            });
        });
    }
}
