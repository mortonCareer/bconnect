package so.morton.api.api.controller.v1.request;

import java.util.List;

public record UpdatePostRequest(
        List<String> images,
        String content
) {}
