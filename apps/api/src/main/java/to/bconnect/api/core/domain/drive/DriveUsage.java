package to.bconnect.api.core.domain.drive;

public record DriveUsage(
        Long usedBytes,
        Long limitBytes
) {
}
