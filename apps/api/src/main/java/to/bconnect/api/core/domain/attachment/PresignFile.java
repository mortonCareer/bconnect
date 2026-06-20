package to.bconnect.api.core.domain.attachment;

public record PresignFile(
    String filename,
    String contentType,
    Long size
) {}
