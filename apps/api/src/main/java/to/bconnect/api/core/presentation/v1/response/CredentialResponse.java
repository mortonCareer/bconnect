package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.credential.Credential;
import to.bconnect.api.core.storage.credential.CredentialStatus;
import to.bconnect.api.core.storage.credential.CredentialType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CredentialResponse(
        Long id,
        Long profileId,
        CredentialType type,
        CredentialStatus status,
        LocalDate expiredAt,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static CredentialResponse of(Credential credential) {
        return new CredentialResponse(
                credential.id(),
                credential.profileId(),
                credential.type(),
                credential.status(),
                credential.expiredAt(),
                credential.createdAt(),
                credential.modifiedAt()
        );
    }
}