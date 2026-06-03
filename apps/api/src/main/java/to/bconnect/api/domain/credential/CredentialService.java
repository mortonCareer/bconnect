package to.bconnect.api.domain.credential;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.api.controller.v1.request.CreateCredentialRequest;
import to.bconnect.api.domain.profile.Profile;
import to.bconnect.api.domain.profile.ProfileFinder;
import to.bconnect.api.storage.domain.credential.CredentialEntity;
import to.bconnect.api.storage.domain.credential.CredentialRepository;

import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.support.security.User;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CredentialService {

    private final CredentialRepository credentialRepository;
    private final CredentialFinder credentialFinder;
    private final ProfileFinder profileFinder;

    @Transactional(readOnly = true)
    public List<Credential> getAll(Long profileId) {
        return credentialFinder.findFilteredByProfileId(profileId);
    }

    @Transactional
    public Credential create(User user, CreateCredentialRequest request) {
        Profile profile = profileFinder.findByMemberId(user.id());

        CredentialEntity credential = CredentialEntity.builder()
                .profileId(profile.id())
                .type(request.type())
                .expiredAt(request.expiredAt())
                .build();

        credentialRepository.save(credential);
        return Credential.of(credential);
    }

    @Transactional
    public void delete(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());
        CredentialEntity found = credentialRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getProfileId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        credentialRepository.delete(found);
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