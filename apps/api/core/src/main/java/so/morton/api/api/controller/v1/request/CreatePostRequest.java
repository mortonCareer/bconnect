package so.morton.api.api.controller.v1.request;

import java.util.List;

public record CreatePostRequest(
        Long authorId,
        Long taskId,
        List<String> images,
        String content
) {}
