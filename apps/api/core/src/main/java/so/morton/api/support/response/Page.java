package so.morton.api.support.response;

import java.util.List;

public record Page<T>(
        List<T> content,
        boolean hasNext
) {}
