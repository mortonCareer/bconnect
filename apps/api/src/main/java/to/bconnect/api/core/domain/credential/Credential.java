package to.bconnect.api.core.domain.credential;

import to.bconnect.api.core.storage.credential.CredentialEntity;
import to.bconnect.api.core.storage.credential.CredentialStatus;
import to.bconnect.api.core.storage.credential.CredentialType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record Credential(
    Long id,
    Long memberId,
    CredentialType type,
    CredentialStatus status,
    LocalDate expiredAt,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Credential of(CredentialEntity entity) {
        return new Credential(
                entity.getId(),
                entity.getMemberId(),
                entity.getType(),
                entity.getStatus(),
                entity.getExpiredAt(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}