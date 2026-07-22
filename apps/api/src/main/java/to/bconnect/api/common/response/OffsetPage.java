package to.bconnect.api.common.response;

import org.springframework.data.domain.Slice;

import java.util.List;

public record OffsetPage<T>(
        List<T> content,
        boolean hasNext
) {
    public static <T> OffsetPage<T> from(Slice<T> slice) {
        return new OffsetPage<>(slice.getContent(), slice.hasNext());
    }
}
