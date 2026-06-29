package to.bconnect.api.attachment;

import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentEntity;
import to.bconnect.api.storage.attachment.AttachmentStatus;
import to.bconnect.api.storage.attachment.AttachmentType;

import java.time.LocalDateTime;
import java.util.List;

public record Attachment(
    Long id,
    Long memberId,
    AttachmentType type,
    AttachmentStatus status,
    AttachmentContext context,
    Long contextId,
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
                entity.getUuid(),
                entity.getStem(),
                entity.getExt(),
                entity.getContentType(),
                entity.getSize(),
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
