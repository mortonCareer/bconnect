package to.bconnect.api.notification.domain.target;

import to.bconnect.api.notification.domain.NotificationType;

public interface NotificationTargetResolver<E> {

    NotificationType supports();

    ResolvedNotification resolve(E event);
}
