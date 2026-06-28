package to.bconnect.api.attachment;

public record PresignedFile(
    Long id,
    String uploadUrl
) {}
