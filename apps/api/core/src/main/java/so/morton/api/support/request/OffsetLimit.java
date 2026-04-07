package so.morton.api.support.request;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public record OffsetLimit(
        int offset,
        int limit,
        boolean reverse
) {
    public OffsetLimit {
        if (offset < 0) offset = 0;
        if (limit <= 0) limit = 20;
    }

    public Pageable toPageable() {
        int page = offset / limit;
        Sort sort = reverse
                ? Sort.by(Sort.Direction.DESC, "id")
                : Sort.by(Sort.Direction.ASC, "id");
        return PageRequest.of(page, limit, sort);
    }
}
