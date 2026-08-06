package to.bconnect.api.support.fixture;

import lombok.val;
import to.bconnect.api.notification.domain.Notification;
import to.bconnect.api.notification.domain.PushNotification;
import to.bconnect.api.notification.domain.push.PushPayload;
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationSenderType;
import to.bconnect.api.storage.notification.NotificationType;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class NotificationFactory {

    private static final String SENDER_NAME = "sender";
    private static final String CONTENT = "content";

    public static Notification domain(Long id, Long memberId, Long senderId, NotificationType type,
                                      NotificationReferenceType referenceType, Long referenceId) {
        return new Notification(id, memberId, type, NotificationSenderType.MEMBER, senderId,
                referenceType, referenceId, false, MIN_DATE_TIME);
    }

    public static PushNotification command(Long memberId, Long senderId, NotificationType type,
                                           NotificationReferenceType referenceType, Long referenceId) {
        return new PushNotification(null, memberId, type, NotificationSenderType.MEMBER, senderId, SENDER_NAME,
                referenceType, referenceId, CONTENT);
    }

    public static PushNotification systemCommand(Long memberId, NotificationType type,
                                                 NotificationReferenceType referenceType) {
        return new PushNotification(null, memberId, type, null, null, null, referenceType, null, null);
    }

    public static PushPayload payload(Long id, Long memberId, Long senderId, NotificationType type,
                                      NotificationReferenceType referenceType, Long referenceId) {
        val command = command(memberId, senderId, type, referenceType, referenceId);
        val notification = new PushNotification(id, command.memberId(), command.type(), command.senderType(),
                command.senderId(), command.senderName(), command.referenceType(), command.referenceId(),
                command.body());
        return PushPayload.of(notification);
    }

    public static NotificationEntity entity(Long memberId, Long senderId, NotificationType type,
                                            NotificationReferenceType referenceType, Long referenceId) {
        return new NotificationEntity(memberId, type, NotificationSenderType.MEMBER, senderId,
                referenceType, referenceId, false);
    }
}
