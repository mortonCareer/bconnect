package to.bconnect.api.common.request;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public record CursorLimit(
        Long cursor,
        Integer limit,
        Boolean reverse
) {
    private static final int DEFAULT_LIMIT = 20;

    public CursorLimit {
        if (limit == null || limit <= 0) limit = DEFAULT_LIMIT;
        if (reverse == null) reverse = false;
    }

    public Pageable toPageable() {
        Sort sort = reverse
                ? Sort.by(Sort.Direction.ASC, "id")
                : Sort.by(Sort.Direction.DESC, "id");
        return PageRequest.of(0, limit, sort);
    }
}
