package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.credential.Credential;
import to.bconnect.api.storage.credential.CredentialStatus;
import to.bconnect.api.storage.credential.CredentialType;

import java.time.LocalDate;
import java.time.Instant;

public record CredentialSummaryResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) CredentialType type,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) CredentialStatus status,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) LocalDate expiredAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt
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
