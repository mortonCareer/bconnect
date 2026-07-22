package to.bconnect.api.core.domain.post;

import java.util.List;

public record UpdatePost(
        Long taskId,
        List<Long> attachmentIds,
        String content
) {}
