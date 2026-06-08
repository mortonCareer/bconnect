package to.bconnect.api.core.domain.post;

import to.bconnect.api.storage.post.PostEntity;

import java.time.LocalDateTime;
import java.util.List;

public record Post(
    Long id,
    Long memberId,
    Long taskId,
    List<String> images,
    String content,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Post of(PostEntity entity) {
        return new Post(
                entity.getId(),
                entity.getMemberId(),
                entity.getTaskId(),
                entity.getImages(),
                entity.getContent(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
