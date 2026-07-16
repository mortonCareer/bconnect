package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.attachment.domain.Attachment;
import to.bconnect.api.attachment.presentation.v1.AttachmentResponse;
import to.bconnect.api.core.domain.credential.Credential;
import to.bconnect.api.storage.credential.CredentialStatus;
import to.bconnect.api.storage.credential.CredentialType;

import java.time.LocalDate;
import java.time.Instant;

public record CredentialResponse(
        Long id,
        Long memberId,
        CredentialType type,
        CredentialStatus status,
        LocalDate expiredAt,
        Instant createdAt,
        Instant modifiedAt,
        AttachmentResponse attachment
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