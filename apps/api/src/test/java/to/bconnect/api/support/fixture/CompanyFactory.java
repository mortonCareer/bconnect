package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.company.Company;
import to.bconnect.api.core.domain.company.CreateCompany;
import to.bconnect.api.storage.company.CompanyEntity;

import static to.bconnect.api.support.fixture.FixtureConstant.DEFAULT_ATTACHMENT_ID;
import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class CompanyFactory {

    public static Company domain(Long id, Long memberId) {
        return new Company(id, memberId, "company", "0000001000", MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static CompanyEntity entity(Long memberId) {
        return new CompanyEntity(
                memberId,
                "company",
                "0000001000"
        );
    }

    public static CreateCompany command() {
        return new CreateCompany("company", "0000001000", DEFAULT_ATTACHMENT_ID);
    }
}
