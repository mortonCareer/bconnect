package to.bconnect.api.core.domain.post;

import to.bconnect.api.storage.post.PostEntity;

import java.time.OffsetDateTime;

public record Post(
    Long id,
    Long memberId,
    Long taskId,
    String content,
    OffsetDateTime createdAt,
    OffsetDateTime modifiedAt
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
