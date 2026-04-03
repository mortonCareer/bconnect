package so.morton.api.api.controller.v1.request;

import jakarta.validation.constraints.NotNull;
import so.morton.api.storage.value.CredentialType;

import java.time.LocalDate;

public record CreateCredentialRequest(
        @NotNull CredentialType type,
        LocalDate expiredAt
) {}