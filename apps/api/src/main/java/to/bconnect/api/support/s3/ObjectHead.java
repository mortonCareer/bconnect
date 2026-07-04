package to.bconnect.api.support.s3;

public record ObjectHead(
    String contentType,
    Long size
) {}
