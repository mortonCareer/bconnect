package to.bconnect.api.core.domain.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.storage.device.DeviceTokenRepository;
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationRepository;
import to.bconnect.api.storage.notification.NotificationTypeEntity;
import to.bconnect.api.storage.notification.NotificationTypeRepository;
import to.bconnect.api.support.push.PushPayload;
import to.bconnect.api.support.push.PushSendResult;
import to.bconnect.api.support.push.PushSender;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final String CHAT_MESSAGE = "CHAT_MESSAGE";
    private static final int PREVIEW_MAX = 100;

    private final NotificationRepository notificationRepository;
    private final NotificationTypeRepository notificationTypeRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final MemberResolver memberResolver;
    private final PushSender pushSender;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void notifyChatMessage(Long senderId, Long chatId, List<Long> recipientIds,
                                  Set<Long> activeMemberIds, String preview) {
        if (recipientIds.isEmpty()) return;

        Map<Long, Long> pushTargets = new HashMap<>();
        for (Long receiverId : recipientIds) {
            NotificationEntity saved = notificationRepository.save(
                    new NotificationEntity(senderId, receiverId, CHAT_MESSAGE, chatId, preview));
            if (!activeMemberIds.contains(receiverId)) {
                pushTargets.put(receiverId, saved.getId());
            }
        }

        if (!pushTargets.isEmpty()) {
            eventPublisher.publishEvent(new ChatPushRequested(senderId, chatId, preview, pushTargets));
        }
    }

    // 커밋 후 발송(채팅 롤백과 분리). REQUIRES_NEW disable() 이 새 트랜잭션에서 영속화됨.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void dispatchChatPush(ChatPushRequested event) {
        NotificationTypeEntity type = notificationTypeRepository.findByCode(CHAT_MESSAGE)
                .orElseThrow(() -> new CodeException(NotificationExceptionCode.UNKNOWN_TYPE));

        String senderName = event.senderId() == null ? "" : memberResolver.find(event.senderId()).name();
        String title = type.getMessage().replace("{sender}", senderName);
        String body = truncate(event.preview());
        String referenceType = type.getReferenceType().name().toLowerCase();
        String url = "/n/" + referenceType + "/" + event.chatId();

        event.targetNotificationIds().forEach((memberId, notificationId) -> {
            PushPayload payload = new PushPayload(title, body, url, Map.of(
                    "notification_id", String.valueOf(notificationId),
                    "reference_type", referenceType,
                    "reference_id", String.valueOf(event.chatId())
            ));
            deviceTokenRepository.findByMemberIdAndEnabledTrue(memberId).forEach(device -> {
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

    private static String truncate(String text) {
        if (text == null) return "";
        return text.length() <= PREVIEW_MAX ? text : text.substring(0, PREVIEW_MAX) + "…";
    }
}
