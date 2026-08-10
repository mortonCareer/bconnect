package to.bconnect.api.support.fixture;

import to.bconnect.api.notification.domain.CreateNotification;
import to.bconnect.api.notification.domain.Notification;
import to.bconnect.api.notification.domain.push.PushNotification;
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

    public static CreateNotification command(Long memberId, Long senderId, NotificationType type,
                                             NotificationReferenceType referenceType, Long referenceId) {
        return new CreateNotification(memberId, type, NotificationSenderType.MEMBER, senderId,
                referenceType, referenceId);
    }

    public static CreateNotification systemCommand(Long memberId, NotificationType type,
                                                   NotificationReferenceType referenceType) {
        return new CreateNotification(memberId, type, null, null, referenceType, null);
    }

    public static PushNotification pushCommand(Long id, Long memberId, NotificationType type,
                                               NotificationReferenceType referenceType, Long referenceId) {
        return new PushNotification(id, memberId, type.render(SENDER_NAME), CONTENT, referenceType, referenceId);
    }

    public static NotificationEntity entity(Long memberId, Long senderId, NotificationType type,
                                            NotificationReferenceType referenceType, Long referenceId) {
        return new NotificationEntity(memberId, type, NotificationSenderType.MEMBER, senderId,
                referenceType, referenceId, false);
    }
}
