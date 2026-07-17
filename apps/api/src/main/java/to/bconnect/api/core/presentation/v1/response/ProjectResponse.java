package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.project.Project;
import to.bconnect.api.storage.Address;

import java.time.Instant;

public record ProjectResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long companyId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String title,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Address address,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt
) {
    public static ProjectResponse of(Project project) {
        return new ProjectResponse(
                project.id(),
                project.companyId(),
                project.title(),
                project.address(),
                project.createdAt(),
                project.modifiedAt()
        );
    }
}
