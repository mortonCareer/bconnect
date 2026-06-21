package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.credential.CreateCredential;
import to.bconnect.api.storage.credential.CredentialType;

import java.time.LocalDate;

public record CreateCredentialRequest(
        @NotNull CredentialType type,
        LocalDate expiredAt,
        Long attachmentId
) {
    public CreateCredential toCommand() {
        return new CreateCredential(type, expiredAt, attachmentId);
    }
}