package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.post.Post;

import java.time.LocalDateTime;
import java.util.List;

public record PostResponse(
        Long id,
        Long memberId,
        Long taskId,
        List<String> images,
        String content,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static PostResponse of(Post post, List<String> images) {
        return new PostResponse(
                post.id(),
                post.memberId(),
                post.taskId(),
                images,
                post.content(),
                post.createdAt(),
                post.modifiedAt()
        );
    }
}
