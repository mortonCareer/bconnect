package to.bconnect.api.domain.post;

import to.bconnect.api.storage.domain.post.PostEntity;

import java.time.LocalDateTime;
import java.util.List;
import org.hibernate.Hibernate;

public record Post(
    Long id,
    Long profileId,
    Long taskId,
    List<String> images,
    String content,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Post of(PostEntity entity) {
        Hibernate.initialize(entity.getImages());
        return new Post(
                entity.getId(),
                entity.getProfileId(),
                entity.getTaskId(),
                entity.getImages(),
                entity.getContent(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
