package to.bconnect.api.core.domain.credential;

import to.bconnect.api.storage.credential.CredentialStatus;

public record CredentialReviewedEvent(
        Long credentialId,
        Long memberId,
        CredentialStatus status
) { }
