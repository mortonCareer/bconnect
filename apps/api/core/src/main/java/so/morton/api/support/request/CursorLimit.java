package so.morton.api.support.request;

public record CursorLimit(
        String cursor,
        int limit,
        boolean reverse
) {
    public CursorLimit {
        if (limit <= 0) limit = 20;
    }
}
