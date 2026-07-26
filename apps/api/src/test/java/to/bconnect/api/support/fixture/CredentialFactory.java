package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.credential.CreateCredential;
import to.bconnect.api.core.domain.credential.Credential;
import to.bconnect.api.storage.credential.CredentialEntity;
import to.bconnect.api.storage.credential.CredentialStatus;
import to.bconnect.api.storage.credential.CredentialType;

import static to.bconnect.api.support.fixture.FixtureConstant.MAX_DATE;
import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class CredentialFactory {

    public static Credential domain(Long id, Long memberId) {
        return new Credential(id, memberId, CredentialType.SOLE_PROPRIETOR,
                CredentialStatus.PENDING, MAX_DATE, null,
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static CredentialEntity entity(Long memberId) {
        return new CredentialEntity(memberId, CredentialType.SOLE_PROPRIETOR, null, null);
    }

    public static CreateCredential command() {
        return new CreateCredential(CredentialType.SOLE_PROPRIETOR, MAX_DATE, null, null);
    }
}
