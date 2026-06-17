package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.company.Company;
import to.bconnect.api.security.member.Member;

import java.time.LocalDateTime;

public record CompanyResponse(
        Long id,
        MemberSummaryResponse member,
        String name,
        String brn,
        String picture,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static CompanyResponse of(Company company, Member member) {
        return new CompanyResponse(
                company.id(),
                MemberSummaryResponse.of(member),
                company.name(),
                company.brn(),
                company.picture(),
                company.createdAt(),
                company.modifiedAt()
        );
    }
}
