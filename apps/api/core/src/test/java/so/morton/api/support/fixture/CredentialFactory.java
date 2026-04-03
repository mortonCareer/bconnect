package so.morton.api.support.fixture;

import so.morton.api.api.controller.v1.request.CreateCredentialRequest;
import so.morton.api.domain.credential.Credential;
import so.morton.api.storage.domain.credential.CredentialEntity;
import so.morton.api.storage.value.CredentialStatus;
import so.morton.api.storage.value.CredentialType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class CredentialFactory {

    public static Credential create(Long id, Long profileId) {
        return new Credential(id, profileId, CredentialType.SOLE_PROPRIETOR,
                CredentialStatus.PENDING, LocalDate.MAX,
                LocalDateTime.MIN, LocalDateTime.MIN);
    }

    public static CredentialEntity createEntity(Long profileId, CredentialStatus status) {
        return CredentialEntity.builder()
                .profileId(profileId)
                .type(CredentialType.SOLE_PROPRIETOR)
                .build();
    }

    public static CreateCredentialRequest createRequest() {
        return new CreateCredentialRequest(CredentialType.SOLE_PROPRIETOR);
    }
}
