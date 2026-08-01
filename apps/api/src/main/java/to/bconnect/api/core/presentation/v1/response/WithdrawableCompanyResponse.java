package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.company.Company;

import java.time.Instant;

public record WithdrawableCompanyResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String name,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String brn,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String picture,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Instant modifiedAt
) {
    public static WithdrawableCompanyResponse of(Company company, String picture) {
        return new WithdrawableCompanyResponse(
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
