package to.bconnect.api.core.domain.credential;

import to.bconnect.api.storage.credential.CredentialStatus;
import to.bconnect.api.storage.credential.CredentialType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record Credential(
    Long id,
    Long memberId,
    CredentialType type,
    CredentialStatus status,
    LocalDate expiredAt,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {}