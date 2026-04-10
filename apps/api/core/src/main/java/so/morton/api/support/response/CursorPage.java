package so.morton.api.support.response;

import java.util.List;

public record CursorPage<T>(
        List<T> content,
        String nextCursor,
        boolean hasNext
) {}
