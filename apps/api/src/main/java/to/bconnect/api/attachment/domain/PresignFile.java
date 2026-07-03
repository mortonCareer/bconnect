package to.bconnect.api.attachment.domain;

public record PresignFile(
    String filename,
    String contentType,
    Long size
) {}
