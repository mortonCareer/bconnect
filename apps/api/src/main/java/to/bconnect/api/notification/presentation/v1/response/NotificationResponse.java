package to.bconnect.api.notification.presentation.v1.response;

import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.core.domain.notification.Notification;
import to.bconnect.api.core.domain.notification.NotificationArgs;
import to.bconnect.api.core.presentation.v1.response.MemberSummaryResponse;
import to.bconnect.api.notification.domain.NotificationType;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

public record NotificationResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String type,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String message,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String content,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String referenceType,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Long referenceId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) MemberSummaryResponse sender,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean read,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt
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
