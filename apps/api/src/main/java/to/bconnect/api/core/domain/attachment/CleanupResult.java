package to.bconnect.api.core.domain.attachment;

public record CleanupResult(
    int pending,
    int orphans,
    int purged
) {}
