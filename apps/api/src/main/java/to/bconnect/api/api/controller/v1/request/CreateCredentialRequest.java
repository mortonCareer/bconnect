package to.bconnect.api.api.controller.v1.request;

import jakarta.validation.constraints.NotNull;
import to.bconnect.api.storage.common.value.CredentialType;

import java.time.LocalDate;

public record CreateCredentialRequest(
        @NotNull CredentialType type,
        LocalDate expiredAt
) {}