package to.bconnect.api.attachment.presentation.v1;


import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.attachment.domain.PresignedFile;

public record PresignedFileResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String uploadUrl
) {
    public static PresignedFileResponse of(PresignedFile file) {
        return new PresignedFileResponse(file.id(), file.uploadUrl());
    }
}
