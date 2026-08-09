package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.company.Company;
import to.bconnect.api.storage.company.CompanyStatus;

import java.time.Instant;

public record CompanyResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String name,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String brn,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) CompanyStatus status,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String picture,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt
) {
    public static CompanyResponse of(Company company, String picture) {
        return new CompanyResponse(
                company.id(),
                company.memberId(),
                company.name(),
                company.brn(),
                company.status(),
                picture,
                company.createdAt(),
                company.modifiedAt()
        );
    }
}
