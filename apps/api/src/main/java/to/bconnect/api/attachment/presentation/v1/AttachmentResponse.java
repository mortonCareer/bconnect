package to.bconnect.api.attachment.presentation.v1;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.attachment.domain.Attachment;
import to.bconnect.api.storage.attachment.AttachmentType;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record AttachmentResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) AttachmentType type,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String filename,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String contentType,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long size,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String url
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

    public static List<AttachmentResponse> listOf(List<Attachment> attachments, Map<Long, String> urls) {
        return attachments.stream()
                .map(it -> of(it, urls.get(it.id())))
                .toList();
    }
}
