package to.bconnect.api.core.domain.attachment;

import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentEntity;
import to.bconnect.api.storage.attachment.AttachmentStatus;
import to.bconnect.api.storage.attachment.AttachmentType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record Attachment(
    Long id,
    Long memberId,
    AttachmentContext context,
    AttachmentType type,
    Long contextId,
    UUID uuid,
    String filename,
    String extension,
    String contentType,
    Long size,
    AttachmentStatus status,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Attachment of(AttachmentEntity entity) {
        return new Attachment(
                entity.getId(),
                entity.getMemberId(),
                entity.getContext(),
                entity.getType(),
                entity.getContextId(),
                entity.getUuid(),
                entity.getFilename(),
                entity.extensionOf(),
                entity.getContentType(),
                entity.getSize(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }

    public static List<Attachment> of(List<AttachmentEntity> entities) {
        return entities.stream()
                .map(Attachment::of)
                .toList();
    }
}
