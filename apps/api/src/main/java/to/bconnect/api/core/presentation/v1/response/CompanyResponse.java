package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.company.Company;

import java.time.LocalDateTime;

public record CompanyResponse(
        Long id,
        Long memberId,
        String name,
        String brn,
        String picture,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
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
