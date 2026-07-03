package to.bconnect.api.attachment.domain;

import to.bconnect.api.storage.attachment.*;

import java.time.LocalDateTime;

public record Attachment(
    Long id,
    Long memberId,
    AttachmentType type,
    AttachmentStatus status,
    AttachmentContext context,
    Long contextId,
    ReferenceType referenceType,
    Long referenceId,
    String uuid,
    String stem,
    String ext,
    String contentType,
    Long size,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Attachment of(AttachmentEntity entity) {
        return new Attachment(
                entity.getId(),
                entity.getMemberId(),
                entity.getType(),
                entity.getStatus(),
                entity.getContext(),
                entity.getContextId(),
                entity.getReferenceType(),
                entity.getReferenceId(),
                entity.getUuid(),
                entity.getStem(),
                entity.getExt(),
                entity.getContentType(),
                entity.getSize(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
