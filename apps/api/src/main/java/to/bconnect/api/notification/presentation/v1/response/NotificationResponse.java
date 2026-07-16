package to.bconnect.api.notification.presentation.v1.response;

import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.core.domain.notification.Notification;
import to.bconnect.api.core.domain.notification.NotificationArgs;
import to.bconnect.api.core.presentation.v1.response.MemberSummaryResponse;
import to.bconnect.api.notification.domain.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String type,
        String message,
        String content,
        String referenceType,
        Long referenceId,
        MemberSummaryResponse sender,
        boolean read,
        Instant createdAt
) {
    public static NotificationResponse of(Notification notification, NotificationType type,
                                          Member sender, String senderPicture) {
        NotificationArgs args = notification.args();
        if (args.isEmpty() && sender != null) {
            args = NotificationArgs.senderName(sender.name());
        }
        return new NotificationResponse(
                notification.id(),
                notification.typeCode(),
                type.render(args),
                notification.content(),
                type.referenceType().name().toLowerCase(),
                notification.referenceId(),
                sender == null ? null : MemberSummaryResponse.of(sender, senderPicture),
                notification.read(),
                notification.createdAt()
        );
    }
}
