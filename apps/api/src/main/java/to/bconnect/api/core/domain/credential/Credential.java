package to.bconnect.api.core.domain.credential;

import to.bconnect.api.storage.credential.CredentialEntity;
import to.bconnect.api.storage.credential.CredentialStatus;
import to.bconnect.api.storage.credential.CredentialType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record Credential(
    Long id,
    Long memberId,
    CredentialType type,
    CredentialStatus status,
    LocalDate expiredAt,
    Long attachmentId,
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
                entity.getAttachmentId(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}