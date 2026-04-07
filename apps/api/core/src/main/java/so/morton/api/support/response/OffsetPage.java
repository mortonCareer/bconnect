package so.morton.api.support.response;

import java.util.List;

public record OffsetPage<T>(
        List<T> content,
        boolean hasNext
) {}
