package to.bconnect.api.attachment.infrastructure.s3;

public record StoredObject(
    String contentType,
    Long size
) {}
