package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.company.Company;

import java.time.LocalDateTime;

public record CompanyResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String name,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String brn,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String picture,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime modifiedAt
) {
    public static CompanyResponse of(Company company, String picture) {
        return new CompanyResponse(
                company.id(),
                company.memberId(),
                company.name(),
                company.brn(),
                picture,
                company.createdAt(),
                company.modifiedAt()
        );
    }
}
