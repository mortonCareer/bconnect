package so.morton.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.credential.CredentialEntity;
import so.morton.api.storage.domain.credential.CredentialRepository;
import so.morton.api.storage.value.CredentialType;

@Component
public class CredentialFactory {

    @Autowired private CredentialRepository credentialRepository;

    public CredentialEntity create(Long profileId) {
        return credentialRepository.save(CredentialEntity.builder()
                .profileId(profileId)
                .type(CredentialType.IDENTITY_VERIFICATION)
                .build());
    }
}
