package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.attachment.domain.Attachment;
import to.bconnect.api.attachment.presentation.v1.AttachmentResponse;
import to.bconnect.api.core.domain.credential.Credential;
import to.bconnect.api.storage.credential.CredentialStatus;
import to.bconnect.api.storage.credential.CredentialType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CredentialResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) CredentialType type,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) CredentialStatus status,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) LocalDate expiredAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime modifiedAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) AttachmentResponse attachment
) {
    public static CredentialResponse of(Credential credential, Attachment attachment, String url) {
        return new CredentialResponse(
                credential.id(),
                credential.memberId(),
                credential.type(),
                credential.status(),
                credential.expiredAt(),
                credential.createdAt(),
                credential.modifiedAt(),
                attachment == null ? null : AttachmentResponse.of(attachment, url)
        );
    }
}