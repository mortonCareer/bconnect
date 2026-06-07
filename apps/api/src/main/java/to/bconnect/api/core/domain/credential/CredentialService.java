package to.bconnect.api.core.domain.credential;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.core.presentation.v1.request.CreateCredentialRequest;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.profile.ProfileFinder;
import to.bconnect.api.core.storage.credential.CredentialEntity;
import to.bconnect.api.core.storage.credential.CredentialRepository;

import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.storage.credential.CredentialStatus;
import to.bconnect.api.security.User;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CredentialService {

    private final CredentialRepository credentialRepository;
    private final ProfileFinder profileFinder;

    @Transactional(readOnly = true)
    public List<Credential> list(Long profileId) {
        // latest one per type
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

    @Transactional
    public Credential create(User user, CreateCredentialRequest request) {
        Profile profile = profileFinder.findByMemberId(user.id());

        CredentialEntity entity = CredentialEntity.builder()
                .profileId(profile.id())
                .type(request.type())
                .expiredAt(request.expiredAt())
                .build();

        credentialRepository.save(entity);
        return Credential.of(entity);
    }

    @Transactional
    public void delete(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());

        credentialRepository.findById(id).ifPresent(found -> {
            if (!found.getProfileId().equals(profile.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            credentialRepository.delete(found);
        });
    }

    @Transactional
    public void accept(Long id) {
        CredentialEntity found = credentialRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        found.accept();
    }

    @Transactional
    public void deny(Long id) {
        CredentialEntity found = credentialRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        found.deny();
    }
}