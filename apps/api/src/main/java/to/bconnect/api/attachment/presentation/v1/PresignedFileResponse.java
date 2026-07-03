package to.bconnect.api.attachment.presentation.v1;


import to.bconnect.api.attachment.domain.PresignedFile;

public record PresignedFileResponse(
        Long id,
        String uploadUrl
) {
    public static PresignedFileResponse of(PresignedFile file) {
        return new PresignedFileResponse(file.id(), file.uploadUrl());
    }
}
