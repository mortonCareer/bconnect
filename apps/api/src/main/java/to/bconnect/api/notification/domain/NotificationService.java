package to.bconnect.api.notification.domain;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.core.domain.notification.NotificationEvent;
import to.bconnect.api.core.domain.notification.NotificationExceptionCode;
import to.bconnect.api.core.domain.notification.NotificationLinkCommand;
import to.bconnect.api.core.domain.notification.NotificationLinker;
import to.bconnect.api.notification.domain.push.PushNotification;
import to.bconnect.api.notification.domain.push.PushPayload;
import to.bconnect.api.notification.domain.push.PushSendResult;
import to.bconnect.api.notification.domain.push.PushSender;
import to.bconnect.api.notification.domain.target.NotificationTargetResolver;
import to.bconnect.api.notification.domain.target.ResolvedNotification;
import to.bconnect.api.storage.notification.NotificationType;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
public class NotificationService {

    private final Map<NotificationType, NotificationTargetResolver<? extends NotificationEvent>> resolvers;
    private final NotificationLinker notificationLinker;
    private final DeviceService deviceService;
    private final PushSender pushSender;

    public NotificationService(
            List<NotificationTargetResolver<? extends NotificationEvent>> resolvers,
            NotificationLinker notificationLinker,
            DeviceService deviceService,
            PushSender pushSender) {
        this.resolvers = resolvers.stream()
                .collect(Collectors.toMap(NotificationTargetResolver::supports, Function.identity()));
        this.notificationLinker = notificationLinker;
        this.deviceService = deviceService;
        this.pushSender = pushSender;
    }

    // 이벤트 커밋 후 새 트랜잭션에서 저장·발송. disable() 은 이 트랜잭션에서 영속화됨.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handle(NotificationType type, NotificationEvent event) {
        ResolvedNotification resolved = resolver(type).resolve(event);

        Set<Long> persistReceiverIds = resolved.targets().persistReceiverIds();
        if (persistReceiverIds.isEmpty()) return;

        var args = resolved.args();
        Map<Long, Long> linked = notificationLinker.link(new NotificationLinkCommand(
                resolved.senderId(), persistReceiverIds, type,
                resolved.referenceId(), resolved.content(), args));

        Set<Long> pushReceiverIds = resolved.targets().pushReceiverIds();
        if (pushReceiverIds.isEmpty()) return;

        PushNotification message = PushNotification.of(
                type, resolved.referenceId(), resolved.content(), args);

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

    @SuppressWarnings("unchecked")
    private NotificationTargetResolver<NotificationEvent> resolver(NotificationType type) {
        NotificationTargetResolver<? extends NotificationEvent> resolver = resolvers.get(type);
        if (resolver == null) {
            throw new CodeException(NotificationExceptionCode.UNKNOWN_TYPE);
        }
        return (NotificationTargetResolver<NotificationEvent>) resolver;
    }
}
