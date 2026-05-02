package so.morton.api.support.request;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public record CursorLimit(
        Long cursor,
        int limit,
        boolean reverse
) {
    public CursorLimit {
        if (limit <= 0) limit = 20;
    }

    public Pageable toPageable() {
        Sort sort = reverse
                ? Sort.by(Sort.Direction.ASC, "id")
                : Sort.by(Sort.Direction.DESC, "id");
        return PageRequest.of(0, limit, sort);
    }
}
