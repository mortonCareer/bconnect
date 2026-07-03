package to.bconnect.api.attachment;


public record PresignedFileResponse(
        Long id,
        String uploadUrl
) {
    public static PresignedFileResponse of(PresignedFile file) {
        return new PresignedFileResponse(file.id(), file.uploadUrl());
    }
}
