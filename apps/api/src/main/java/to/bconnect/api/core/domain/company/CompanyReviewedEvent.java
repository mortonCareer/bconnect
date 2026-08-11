package to.bconnect.api.core.domain.company;

import to.bconnect.api.storage.company.CompanyStatus;

public record CompanyReviewedEvent(
        Long companyId,
        Long memberId,
        CompanyStatus status
) { }
