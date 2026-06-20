package to.bconnect.api.core.domain.attachment;

public record PresignedFile(
    Long id,
    String uploadUrl
) {}
