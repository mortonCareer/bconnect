package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.post.Post;

import java.time.LocalDateTime;
import java.util.List;

public record PostResponse(
        Long id,
        Long profileId,
        Long taskId,
        List<String> images,
        String content,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static PostResponse of(Post post) {
        return new PostResponse(
                post.id(),
                post.profileId(),
                post.taskId(),
                post.images(),
                post.content(),
                post.createdAt(),
                post.modifiedAt()
        );
    }
}
