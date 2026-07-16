package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.company.Company;

import java.time.Instant;

public record CompanyResponse(
        Long id,
        Long memberId,
        String name,
        String brn,
        String picture,
        Instant createdAt,
        Instant modifiedAt
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
