package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.credential.Credential;
import to.bconnect.api.storage.credential.CredentialStatus;
import to.bconnect.api.storage.credential.CredentialType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CredentialSummaryResponse(
        Long id,
        Long memberId,
        CredentialType type,
        CredentialStatus status,
        LocalDate expiredAt,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static CredentialSummaryResponse of(Credential credential) {
        return new CredentialSummaryResponse(
                credential.id(),
                credential.memberId(),
                credential.type(),
                credential.status(),
                credential.expiredAt(),
                credential.createdAt(),
                credential.modifiedAt()
        );
    }
}
