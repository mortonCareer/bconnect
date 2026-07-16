package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.drive.Drive;
import to.bconnect.api.storage.drive.DriveType;

import java.time.Instant;

public record DriveResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) DriveType type,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Long projectId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String title,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt
) {
    public static DriveResponse of(Drive drive) {
        return new DriveResponse(
                drive.id(),
                drive.type(),
                drive.projectId(),
                drive.memberId(),
                drive.title(),
                drive.createdAt(),
                drive.modifiedAt()
        );
    }
}
