package to.bconnect.api.attachment;

public record PresignFile(
    String filename,
    String contentType,
    Long size
) {}
