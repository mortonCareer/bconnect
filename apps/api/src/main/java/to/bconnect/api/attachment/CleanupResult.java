package to.bconnect.api.attachment;

public record CleanupResult(
    int pending,
    int orphans
) {}
