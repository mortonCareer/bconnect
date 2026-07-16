package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.post.Post;

import java.time.LocalDateTime;
import java.util.List;

public record PostResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Long taskId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<String> images,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String content,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime modifiedAt
) {
    public static PostResponse of(Post post, List<String> images) {
        return new PostResponse(
                post.id(),
                post.memberId(),
                post.taskId(),
                images,
                post.content(),
                post.createdAt(),
                post.modifiedAt()
        );
    }
}
