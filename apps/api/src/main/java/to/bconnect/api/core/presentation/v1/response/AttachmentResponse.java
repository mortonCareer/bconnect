package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.attachment.Attachment;
import to.bconnect.api.storage.attachment.AttachmentStatus;
import to.bconnect.api.storage.attachment.AttachmentType;

import java.time.LocalDateTime;

public record AttachmentResponse(
        Long id,
        Long memberId,
        AttachmentType type,
        String filename,
        String contentType,
        Long size,
        AttachmentStatus status,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt,
        String url
) {
    public static AttachmentResponse of(Attachment attachment, String url) {
        return new AttachmentResponse(
                attachment.id(),
                attachment.memberId(),
                attachment.type(),
                attachment.filename(),
                attachment.contentType(),
                attachment.size(),
                attachment.status(),
                attachment.createdAt(),
                attachment.modifiedAt(),
                url
        );
    }
}
