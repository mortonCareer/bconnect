package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.drive.DriveUsage;

public record DriveUsageResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long usedBytes,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long limitBytes
) {
    public static DriveUsageResponse of(DriveUsage usage) {
        return new DriveUsageResponse(
                usage.usedBytes(),
                usage.limitBytes()
        );
    }
}
