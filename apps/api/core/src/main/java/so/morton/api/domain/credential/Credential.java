package so.morton.api.domain.credential;

import so.morton.api.storage.domain.credential.CredentialEntity;
import so.morton.api.storage.value.CredentialStatus;
import so.morton.api.storage.value.CredentialType;

import java.time.LocalDateTime;

public record Credential(
    Long id,
    Long profileId,
    CredentialType type,
    CredentialStatus status,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Credential of(CredentialEntity entity) {
        return new Credential(
                entity.getId(),
                entity.getProfileId(),
                entity.getType(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}