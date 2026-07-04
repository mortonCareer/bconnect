package to.bconnect.api.attachment.domain;

public record PresignedFile(
    Long id,
    String uploadUrl
) {}
