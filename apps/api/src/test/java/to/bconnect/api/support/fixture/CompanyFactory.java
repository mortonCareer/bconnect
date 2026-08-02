package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.company.Company;
import to.bconnect.api.core.domain.company.CreateCompany;
import to.bconnect.api.storage.company.CompanyEntity;

import static to.bconnect.api.support.fixture.FixtureConstant.DEFAULT_ATTACHMENT_ID;
import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class CompanyFactory {

    private static final String NAME = "company";
    private static final String DEFAULT_BRN = "0000001000";

    public static Company domain(Long id, Long memberId) {
        return new Company(id, memberId, NAME, DEFAULT_BRN, MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static CompanyEntity entity(Long memberId) {
        return new CompanyEntity(
                memberId,
                NAME,
                DEFAULT_BRN
        );
    }

    public static CompanyEntity entity(Long memberId, String brn) {
        return new CompanyEntity(
                memberId,
                NAME,
                brn
        );
    }

    public static CreateCompany command() {
        return new CreateCompany(NAME, DEFAULT_BRN, DEFAULT_ATTACHMENT_ID);
    }

    public static CreateCompany command(String brn) {
        return new CreateCompany(NAME, brn, null);
    }

    public static CreateCompany command(String brn, Long attachmentId) {
        return new CreateCompany(NAME, brn, attachmentId);
    }
}
