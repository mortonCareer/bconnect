package to.bconnect.api.common.response;

import org.springframework.data.domain.Window;

import java.util.List;
import java.util.function.Function;

public record CursorPage<T>(
        List<T> content,
        boolean hasNext,
        Long nextCursor
) {
    public static <T> CursorPage<T> from(Window<T> window, Function<T, Long> cursorExtractor) {
        List<T> content = window.getContent();
        boolean hasNext = window.hasNext();
        Long nextCursor = hasNext ? cursorExtractor.apply(content.getLast()) : null;
        return new CursorPage<>(content, hasNext, nextCursor);
    }
}
