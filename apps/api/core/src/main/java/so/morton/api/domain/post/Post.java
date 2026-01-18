package so.morton.api.domain.post;

import so.morton.api.storage.domain.post.PostEntity;

import java.time.LocalDateTime;
import java.util.List;

public record Post(
    Long id,
    Long authorId,
    Long taskId,
    List<String> images,
    String content,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Post of(PostEntity entity) {
        return new Post(
                entity.getId(),
                entity.getAuthorId(),
                entity.getTaskId(),
                entity.getImages(),
                entity.getContent(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
