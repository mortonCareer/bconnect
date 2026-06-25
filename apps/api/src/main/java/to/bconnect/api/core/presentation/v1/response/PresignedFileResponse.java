package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.attachment.PresignedFile;

public record PresignedFileResponse(
        Long id,
        String uploadUrl
) {
    public static PresignedFileResponse of(PresignedFile file) {
        return new PresignedFileResponse(file.id(), file.uploadUrl());
    }
}
