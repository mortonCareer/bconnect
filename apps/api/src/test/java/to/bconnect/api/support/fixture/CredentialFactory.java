package to.bconnect.api.support.fixture;

import to.bconnect.api.api.controller.v1.request.CreateCredentialRequest;
import to.bconnect.api.domain.credential.Credential;
import to.bconnect.api.storage.domain.credential.CredentialEntity;
import to.bconnect.api.storage.common.value.CredentialStatus;
import to.bconnect.api.storage.common.value.CredentialType;

import static to.bconnect.api.support.fixture.FixtureConstant.MAX_DATE;
import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class CredentialFactory {

    public static Credential create(Long id, Long profileId) {
        return new Credential(id, profileId, CredentialType.SOLE_PROPRIETOR,
                CredentialStatus.PENDING, MAX_DATE,
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static CredentialEntity createEntity(Long profileId) {
        return CredentialEntity.builder()
                .profileId(profileId)
                .type(CredentialType.SOLE_PROPRIETOR)
                .build();
    }

    public static CreateCredentialRequest createRequest() {
        return new CreateCredentialRequest(CredentialType.SOLE_PROPRIETOR, MAX_DATE);
    }
}
