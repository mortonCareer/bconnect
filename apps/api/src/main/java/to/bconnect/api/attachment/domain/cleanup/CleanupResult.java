package to.bconnect.api.attachment.domain.cleanup;

public record CleanupResult(
    int pending,
    int orphans
) {}
