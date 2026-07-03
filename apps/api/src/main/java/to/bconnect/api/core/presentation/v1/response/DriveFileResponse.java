package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.attachment.Attachment;
import to.bconnect.api.storage.attachment.AttachmentType;

import java.time.LocalDateTime;

public record DriveFileResponse(
        Long id,
        Long memberId,
        AttachmentType type,
        String filename,
        String contentType,
        Long size,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt,
        String url
) {
    public static DriveFileResponse of(Attachment attachment, String url) {
        return new DriveFileResponse(
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
