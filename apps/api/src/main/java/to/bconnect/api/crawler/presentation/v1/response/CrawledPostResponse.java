package to.bconnect.api.crawler.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.crawler.storage.CrawledPostEntity;
import to.bconnect.api.crawler.storage.CrawledTaskEntity;

import java.time.LocalDateTime;
import java.util.List;

public record CrawledPostResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Long taskId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<String> images,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String title,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String content,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime modifiedAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) CrawledTaskResponse task
) {
    public static CrawledPostResponse of(CrawledPostEntity post, CrawledTaskEntity task) {
        return new CrawledPostResponse(
                post.getId(),
                post.getMemberId(),
                post.getTaskId(),
                post.getImages(),
                post.getTitle(),
                post.getContent(),
                post.getCreatedAt(),
                post.getModifiedAt(),
                task == null ? null : CrawledTaskResponse.of(task)
        );
    }
}
