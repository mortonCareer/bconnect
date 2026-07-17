package to.bconnect.api.core.domain.post;

import to.bconnect.api.storage.post.PostEntity;

import java.time.Instant;

public record Post(
    Long id,
    Long memberId,
    Long taskId,
    String content,
    Instant createdAt,
    Instant modifiedAt
) {
    public static Post of(PostEntity entity) {
        return new Post(
                entity.getId(),
                entity.getMemberId(),
                entity.getTaskId(),
                entity.getContent(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
