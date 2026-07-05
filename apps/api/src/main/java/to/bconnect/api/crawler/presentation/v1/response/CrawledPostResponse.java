package to.bconnect.api.crawler.presentation.v1.response;

import to.bconnect.api.crawler.storage.CrawledPostEntity;
import to.bconnect.api.crawler.storage.CrawledTaskEntity;

import java.time.LocalDateTime;
import java.util.List;

public record CrawledPostResponse(
        Long id,
        Long memberId,
        Long taskId,
        List<String> images,
        String title,
        String content,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt,
        CrawledTaskResponse task
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
