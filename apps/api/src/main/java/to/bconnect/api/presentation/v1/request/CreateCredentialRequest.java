package to.bconnect.api.presentation.v1.request;

import jakarta.validation.constraints.NotNull;
import to.bconnect.api.storage.value.CredentialType;

import java.time.LocalDate;

public record CreateCredentialRequest(
        @NotNull CredentialType type,
        LocalDate expiredAt
) {}