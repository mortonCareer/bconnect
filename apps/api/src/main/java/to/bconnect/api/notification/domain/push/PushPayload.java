package to.bconnect.api.notification.domain.push;

import to.bconnect.api.notification.domain.PushNotification;
import to.bconnect.api.storage.notification.NotificationReferenceType;

import static to.bconnect.api.common.CommonUtils.truncate;

public record PushPayload(
        Long id,
        String title,
        String body,
        NotificationReferenceType referenceType,
        Long referenceId
) {
    private static final int PREVIEW_MAX = 100;

    public static PushPayload of(Long id, PushNotification command) {
        return new PushPayload(
                id,
                command.type().render(command.senderName()),
                truncate(command.body(), PREVIEW_MAX),
                command.referenceType(),
                command.referenceId());
    }
}
