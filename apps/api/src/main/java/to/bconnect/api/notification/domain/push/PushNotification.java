package to.bconnect.api.notification.domain.push;

import to.bconnect.api.storage.notification.NotificationReferenceType;

import static to.bconnect.api.common.CommonUtils.truncate;

public record PushNotification(
        Long id,
        Long receiverId,
        String title,
        String body,
        NotificationReferenceType referenceType,
        Long referenceId
) {
    private static final int PREVIEW_MAX = 100;

    public PushNotification {
        body = truncate(body, PREVIEW_MAX);
    }
}
