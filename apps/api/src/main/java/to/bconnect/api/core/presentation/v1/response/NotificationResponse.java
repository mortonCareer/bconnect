package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.notification.Notification;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.notification.NotificationReferenceType;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String type,
        String message,
        String content,
        String referenceType,
        Long referenceId,
        MemberSummaryResponse sender,
        boolean read,
        LocalDateTime createdAt
) {
    public static NotificationResponse of(Notification notification, String template,
                                          NotificationReferenceType referenceType, Member sender, String senderPicture) {
        return new NotificationResponse(
                notification.id(),
                notification.typeCode(),
                render(template, sender),
                notification.content(),
                referenceType.name().toLowerCase(),
                notification.referenceId(),
                sender == null ? null : MemberSummaryResponse.of(sender, senderPicture),
                notification.read(),
                notification.createdAt()
        );
    }

    private static String render(String template, Member sender) {
        String senderName = sender == null ? "" : sender.name();
        return template.replace("{sender}", senderName);
    }
}
