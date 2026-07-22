package to.bconnect.api.core.domain.credential;

import to.bconnect.api.storage.credential.CredentialType;

import java.time.LocalDate;

public record CreateCredential(
        CredentialType type,
        LocalDate expiredAt,
        String note,
        Long attachmentId
) {}
