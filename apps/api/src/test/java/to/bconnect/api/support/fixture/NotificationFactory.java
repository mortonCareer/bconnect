package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.notification.Notification;
import to.bconnect.api.core.domain.notification.NotificationArgs;
import to.bconnect.api.core.domain.notification.NotificationLinkCommand;
import to.bconnect.api.notification.domain.NotificationType;
import to.bconnect.api.notification.domain.push.PushNotification;
import to.bconnect.api.notification.domain.push.PushPayload;
import to.bconnect.api.notification.domain.push.PushSendResult;
import to.bconnect.api.notification.domain.target.ResolvedNotification;
import to.bconnect.api.storage.notification.NotificationEntity;

import java.util.Map;
import java.util.Set;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class NotificationFactory {

    public static Notification domain(Long id, Long senderId, Long receiverId,
                                      NotificationType type, Long referenceId) {
        return new Notification(id, senderId, receiverId, type.code(), referenceId,
                "content", args(), false, MIN_DATE_TIME);
    }

    public static NotificationArgs args() {
        return new NotificationArgs(Map.of(
                NotificationArgs.SENDER_NAME, "sender",
                NotificationArgs.COMPANY_NAME, "company"
        ));
    }

    public static PushNotification push(NotificationType type, Long referenceId) {
        return new PushNotification(type, referenceId, "title", "body", type.link(referenceId));
    }

    public static PushPayload payload(NotificationType type, Long referenceId) {
        return new PushPayload("title", "body", type.link(referenceId), Map.of(
                "notification_id", "1",
                "type_code", type.code(),
                "reference_type", type.referenceType().name().toLowerCase(),
                "reference_id", referenceId == null ? "" : String.valueOf(referenceId)
        ));
    }

    public static PushSendResult sendResult(String endpointArn) {
        return PushSendResult.success(endpointArn, "message");
    }

    public static ResolvedNotification resolved(Long senderId, Long referenceId, Set<Long> receiverIds) {
        return new ResolvedNotification(senderId, referenceId, "content",
                new ResolvedNotification.Targets(receiverIds, receiverIds));
    }

    public static NotificationLinkCommand command(Long senderId, Set<Long> receiverIds,
                                                  NotificationType type, Long referenceId) {
        return new NotificationLinkCommand(senderId, receiverIds, type.code(), referenceId, "content", args());
    }

    public static NotificationEntity entity(Long senderId, Long receiverId,
                                            NotificationType type, Long referenceId) {
        return new NotificationEntity(senderId, receiverId, type.code(), referenceId, "content", args().toJson());
    }
}
