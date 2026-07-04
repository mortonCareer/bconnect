package to.bconnect.api.attachment.infrastructure.s3;

public record ObjectHead(
    String contentType,
    Long size
) {}
