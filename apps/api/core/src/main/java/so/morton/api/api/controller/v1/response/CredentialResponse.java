package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.credential.Credential;
import so.morton.api.storage.value.CredentialStatus;
import so.morton.api.storage.value.CredentialType;

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