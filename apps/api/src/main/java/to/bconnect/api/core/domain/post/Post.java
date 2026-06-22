package to.bconnect.api.core.domain.post;

import to.bconnect.api.storage.post.PostEntity;

import java.time.LocalDateTime;
import java.util.List;

public record Post(
    Long id,
    Long memberId,
    Long taskId,
    List<Long> attachmentIds,
    String content,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Post of(PostEntity entity) {
        return of(entity, List.of());
    }

    public static Post of(PostEntity entity, List<Long> attachmentIds) {
        return new Post(
                entity.getId(),
                entity.getMemberId(),
                entity.getTaskId(),
                attachmentIds,
                entity.getContent(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
