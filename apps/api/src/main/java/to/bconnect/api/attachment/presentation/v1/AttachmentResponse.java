package to.bconnect.api.attachment.presentation.v1;

import to.bconnect.api.attachment.domain.Attachment;
import to.bconnect.api.storage.attachment.AttachmentType;

import java.time.Instant;

public record AttachmentResponse(
        Long id,
        Long memberId,
        AttachmentType type,
        String filename,
        String contentType,
        Long size,
        Instant createdAt,
        Instant modifiedAt,
        String url
) {
    public static AttachmentResponse of(Attachment attachment, String url) {
        return new AttachmentResponse(
                attachment.id(),
                attachment.memberId(),
                attachment.type(),
                attachment.stem() + "." + attachment.ext(),
                attachment.contentType(),
                attachment.size(),
                attachment.createdAt(),
                attachment.modifiedAt(),
                url
        );
    }
}
