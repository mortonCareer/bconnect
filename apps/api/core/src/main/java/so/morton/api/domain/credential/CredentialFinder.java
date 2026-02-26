package so.morton.api.domain.credential;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.credential.CredentialRepository;

import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CredentialFinder {

    private final CredentialRepository credentialRepository;

    public Credential find(Long credentialId) {
        return credentialRepository.findById(credentialId)
                .filter(e -> !e.isDeleted())
                .map(Credential::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<Credential> findByProfileId(Long profileId) {
        return credentialRepository.findByProfileIdAndDeletedFalse(profileId)
                .stream()
                .map(Credential::of)
                .toList();
    }
}