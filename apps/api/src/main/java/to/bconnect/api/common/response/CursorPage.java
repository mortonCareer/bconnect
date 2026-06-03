package to.bconnect.api.common.response;

import java.util.List;

public record CursorPage<T>(
        List<T> content,
        Long nextCursor,
        boolean hasNext
) {}
