package to.bconnect.api.notification.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.val;
import to.bconnect.api.core.domain.company.Company;
import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.core.presentation.v1.response.WithdrawableCompanyResponse;
import to.bconnect.api.core.presentation.v1.response.WithdrawableMemberResponse;
import to.bconnect.api.notification.domain.Notification;
import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationSenderType;

import java.time.Instant;

public record NotificationResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String type,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) NotificationSenderType senderType,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) WithdrawableMemberResponse senderMember,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) WithdrawableCompanyResponse senderCompany,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String message,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) NotificationReferenceType referenceType,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Long referenceId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean read,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt
) {
    public static NotificationResponse of(Notification notification, Member sender, Company company, String picture) {
        val senderName = sender != null ? sender.name() : company != null ? company.name() : "";
        return new NotificationResponse(
                notification.id(),
                notification.memberId(),
                notification.type().name(),
                notification.senderType(),
                sender == null ? null : WithdrawableMemberResponse.of(sender, picture),
                company == null ? null : WithdrawableCompanyResponse.of(company),
                notification.type().render(senderName),
                notification.referenceType(),
                notification.referenceId(),
                notification.read(),
                notification.createdAt()
        );
    }
}
