package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.attachment.domain.Attachment;
import to.bconnect.api.attachment.presentation.v1.AttachmentResponse;
import to.bconnect.api.core.domain.post.Post;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record PostResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Long taskId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<AttachmentResponse> attachments,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String content,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt
) {
    public static PostResponse of(Post post, List<Attachment> attachments, Map<Long, String> urlMap) {
        return new PostResponse(
                post.id(),
                post.memberId(),
                post.taskId(),
                attachments.stream()
                        .map(it -> AttachmentResponse.of(it, urlMap.get(it.id())))
                        .toList(),
                post.content(),
                post.createdAt(),
                post.modifiedAt()
        );
    }
}
