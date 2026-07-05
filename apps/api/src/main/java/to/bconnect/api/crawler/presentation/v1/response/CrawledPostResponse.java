package to.bconnect.api.crawler.presentation.v1.response;

import to.bconnect.api.crawler.storage.CrawledPostEntity;
import to.bconnect.api.crawler.storage.CrawledTaskEntity;

import java.time.LocalDateTime;
import java.util.List;

public record CrawledPostResponse(
        Long id,
        String title,
        String content,
        List<String> images,
        LocalDateTime createdAt,
        CrawledTaskResponse task
) {
    public static CrawledPostResponse of(CrawledPostEntity post, CrawledTaskEntity task) {
        return new CrawledPostResponse(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getImages(),
                post.getCreatedAt(),
                task == null ? null : CrawledTaskResponse.of(task)
        );
    }
}
