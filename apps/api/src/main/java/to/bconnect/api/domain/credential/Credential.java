package to.bconnect.api.domain.credential;

import to.bconnect.api.storage.domain.credential.CredentialEntity;
import to.bconnect.api.storage.common.value.CredentialStatus;
import to.bconnect.api.storage.common.value.CredentialType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record Credential(
    Long id,
    Long profileId,
    CredentialType type,
    CredentialStatus status,
    LocalDate expiredAt,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Credential of(CredentialEntity entity) {
        return new Credential(
                entity.getId(),
                entity.getProfileId(),
                entity.getType(),
                entity.getStatus(),
                entity.getExpiredAt(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}