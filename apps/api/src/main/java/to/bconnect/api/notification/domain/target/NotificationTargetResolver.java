package to.bconnect.api.notification.domain.target;

import to.bconnect.api.core.domain.notification.NotificationEvent;
import to.bconnect.api.storage.notification.NotificationType;

public interface NotificationTargetResolver<E extends NotificationEvent> {

    NotificationType supports();

    ResolvedNotification resolve(E event);
}
