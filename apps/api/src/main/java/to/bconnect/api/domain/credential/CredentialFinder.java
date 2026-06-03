package to.bconnect.api.domain.credential;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.domain.credential.CredentialRepository;

import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;

import to.bconnect.api.storage.domain.credential.CredentialEntity;
import to.bconnect.api.storage.common.value.CredentialStatus;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class CredentialFinder {

    private final CredentialRepository credentialRepository;

    public Credential find(Long credentialId) {
        return credentialRepository.findById(credentialId)
                .map(Credential::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<Credential> findFilteredByProfileId(Long profileId) {
        return credentialRepository.findByProfileId(profileId)
                .stream()
                .filter(e -> e.getStatus() == CredentialStatus.ACCEPTED)
                .collect(Collectors.groupingBy(
                        CredentialEntity::getType,
                        Collectors.maxBy(Comparator.comparing(CredentialEntity::getCreatedAt))
                ))
                .values().stream()
                .flatMap(Optional::stream)
                .map(Credential::of)
                .toList();
    }

    public List<Credential> findByProfileId(Long profileId) {
        return credentialRepository.findByProfileId(profileId)
                .stream()
                .map(Credential::of)
                .toList();
    }
}