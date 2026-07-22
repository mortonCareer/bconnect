package to.bconnect.api.core.domain.post;

import java.util.List;

public record CreatePost(
        Long taskId,
        List<Long> attachmentIds,
        String content
) {}
