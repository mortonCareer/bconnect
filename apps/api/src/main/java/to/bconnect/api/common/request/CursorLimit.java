package to.bconnect.api.common.request;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Sort;

import java.util.Map;

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

    public ScrollPosition toScrollPosition() {
        return cursor == null
                ? ScrollPosition.keyset()
                : ScrollPosition.of(Map.of("id", cursor), ScrollPosition.Direction.FORWARD);
    }

    public Limit toLimit() {
        return Limit.of(limit);
    }

    public Sort toSort() {
        return reverse
                ? Sort.by(Sort.Direction.ASC, "id")
                : Sort.by(Sort.Direction.DESC, "id");
    }
}
