package to.bconnect.api.core.domain.post;

import java.util.List;

public record CreatePost(
        Long taskId,
        List<String> images,
        String content
) {}
